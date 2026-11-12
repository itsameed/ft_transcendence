const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const { Server } = require('socket.io');

const passport = require('./middleware/googleAuth');
const sessionMiddleware = require('./middleware/session');
const connectDB = require('./config/database.js');

const User = require('./models/Schemas/User');
const Conversation = require('./models/Schemas/Conversation');
const AIGroup = require('./models/Schemas/Group');

const AIChat = require('./routes/ai/chat');

const app = express();

const FRONTEND_URL =
    process.env.FRONTEND_URL || 'http://localhost:5175';

const PORT = process.env.PORT || 6664;

app.set('view engine', 'ejs');

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use(cookieParser());

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

const notificationRoutes = require('./routes/notificationRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const friendRoutes = require('./routes/friendRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupInvitationRoutes = require('./routes/groupInvitationRoutes');

const groupDetailsRouter = require('./routes/GroupDetails');
const loginPageRouter = require('./routes/login.js');
const dashboardRouter = require('./routes/Home.js');
const signupPageRouter = require('./routes/signup.js');
const groupCreationRouter = require('./routes/CreateGroup.js');
const settlementsRouter = require('./routes/Settlement.js');
const expensesRouter = require('./routes/Expenses.js');
const groupTotalExpensesRouter = require('./routes/GroupTotalExpenses.js');
const logoutRouter = require('./routes/Logout.js');
const myProfileRouter = require('./routes/MyProfile.js');
const editProfile = require('./routes/EditProfile.js');
const changePasswordRouter = require('./routes/ChangePassword.js');
const userProfileRouter = require('./routes/UserProfile.js');
const googleAuth = require('./routes/googleAuth');
const adminRoutes = require('./routes/adminRoutes');
const searchUser = require('./routes/searchUser.js');

app.use('/auth/google', googleAuth);
app.use('/', dashboardRouter);
app.use('/auth/login', loginPageRouter);
app.use('/auth/signup', signupPageRouter);
app.use('/auth/logout', logoutRouter);

app.use('/api/dashboard', dashboardRouter);
app.use('/api/my-profile', myProfileRouter);
app.use('/api/profile/edit', editProfile);
app.use('/api/profile/change-password', changePasswordRouter);
app.use('/api/users', userProfileRouter);
app.use('/api/group-details', groupDetailsRouter);
app.use('/api/groups/create', groupCreationRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/settlements/addSettlement', settlementsRouter);

app.use('/api/my-groups/total-expenses', groupTotalExpensesRouter);
app.use('/api/my-groups', groupRoutes);

app.use('/api/expenses', expensesRouter);
app.use('/api/createExpense', expensesRouter);

app.use('/api/group-invitations', groupInvitationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/conversations', messageRoutes);
app.use('/api/conversations', conversationRoutes);

app.use('/api/admin', adminRoutes);
app.use('/search', searchUser);

app.use('/dashboard', dashboardRouter);
app.use('/my-profile', myProfileRouter);
app.use('/my-groups/total-expenses', groupTotalExpensesRouter);
app.use('/my-groups', groupRoutes);

app.use('/api', AIChat);

app.get('/chat/group/:groupId', async (req, res) => {

    if (!req.session?.userId) {
        return res.redirect('/auth/login');
    }

    try {

        const group = await AIGroup.findOne({
            _id: req.params.groupId,
            $or: [
                { createdBy: req.session.userId },
                { 'members.userId': req.session.userId }
            ]
        }).lean();

        if (!group) {
            return res.status(404).send(
                'Group not found or access denied'
            );
        }

        return res.render('groupChat', {
            groupId: group._id.toString(),
            groupName: group.name
        });

    } catch (error) {

        console.error('AI Chat page error:', error);

        return res.status(500).send('Error loading group');
    }
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL,
        credentials: true
    }
});

app.set('io', io);

io.engine.use(sessionMiddleware);

io.use(async (socket, next) => {

    try {

        const userId = socket.request.session?.userId;

        if (!userId) {
            return next(new Error('Authentication required'));
        }

        const user = await User.findById(userId)
            .select('_id status');

        if (!user) {
            return next(new Error('User not found'));
        }

        if (user.status === 'suspended') {
            return next(new Error('Account suspended'));
        }

        socket.userId = user._id.toString();

        return next();

    } catch (error) {

        console.error('Socket authentication error:', error);

        return next(new Error('Authentication failed'));
    }
});

io.on('connection', (socket) => {

    console.log('User connected:', socket.userId);

    socket.join(`user:${socket.userId}`);

    console.log(
        `User ${socket.userId} joined their personal room`
    );

    socket.on('joinConversation', async (conversationId) => {

        try {

            if (!mongoose.isValidObjectId(conversationId)) {

                socket.emit('chatError', {
                    message: 'Invalid conversation ID'
                });

                return;
            }

            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.userId
            });

            if (!conversation) {

                socket.emit('chatError', {
                    message: 'You are not a participant in this conversation'
                });

                return;
            }

            socket.join(`conversation:${conversationId}`);

            console.log(
                `User ${socket.userId} joined conversation:${conversationId}`
            );

        } catch (error) {

            console.error('Join conversation error:', error);

            socket.emit('chatError', {
                message: 'Could not join conversation'
            });
        }
    });

    socket.on('disconnect', (reason) => {

        console.log(
            `User ${socket.userId} disconnected:`,
            reason
        );
    });
});

app.use((err, req, res, next) => {

    if (err.name !== 'CastError') {
        console.error(err);
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID'
        });
    }

    return res.status(500).json({
        message: 'Server error'
    });
});

const startServer = async () => {

    try {

        await connectDB();

        server.listen(PORT, () => {

            console.log(
                `Server running on http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error('Server startup failed:', error);

        process.exit(1);
    }
};

startServer();
export interface Person { id: string; name: string; email: string; presence: 'online' | 'away' | 'offline'; lastSeen?: string; gradient: string }
export interface Msg {
  id: string; senderId: string; text: string; time: string; day?: string; mine?: boolean;
  status?: 'sent' | 'delivered' | 'read'; reactions?: { emoji: string; by: string[] }[];
  replyTo?: { name: string; text: string }; pinned?: boolean; edited?: boolean;
  kind?: 'text' | 'expense' | 'settlement' | 'system' | 'ai';
  expense?: { title: string; amount: number; paidBy: string; yourShare: number; category: string; settled?: boolean };
}
export interface Conv {
  id: string; name: string; kind: string; icon: string; members: string[]; pinned?: boolean; muted?: boolean; archived?: boolean;
  unread: number; typing?: string; balance: number; totalSpent: number;
  last: { text: string; time: string; from: string }; activity: string;
}

export const ME: Person = { id: 'me', name: 'Zack El Amrani', email: 'zack@splitify.app', presence: 'online', gradient: 'linear-gradient(135deg,#0f766e,#14b8a6)' }
export const PEOPLE: Record<string, Person> = {
  me: ME,
  salma: { id: 'salma', name: 'Salma Idrissi', email: 'salma@mail.com', presence: 'online', gradient: 'linear-gradient(135deg,#e11d63,#fb7185)' },
  yassine: { id: 'yassine', name: 'Yassine Bennis', email: 'yassine@mail.com', presence: 'online', gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  omar: { id: 'omar', name: 'Omar Haddad', email: 'omar@mail.com', presence: 'away', lastSeen: '12 min ago', gradient: 'linear-gradient(135deg,#ea580c,#fbbf24)' },
  anas: { id: 'anas', name: 'Anas El Fassi', email: 'anas@mail.com', presence: 'offline', lastSeen: '2 h ago', gradient: 'linear-gradient(135deg,#2563eb,#38bdf8)' },
  lina: { id: 'lina', name: 'Lina Mansouri', email: 'lina@mail.com', presence: 'online', gradient: 'linear-gradient(135deg,#059669,#34d399)' },
  ai: { id: 'ai', name: 'Splitify AI', email: 'assistant', presence: 'online', gradient: 'linear-gradient(135deg,#111827,#374151)' },
}
export const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
export const money = (n: number) => `${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })} MAD`

export const CONVERSATIONS: Conv[] = [
  { id: 'chefchaouen', name: 'Chefchaouen Trip', kind: 'Trip', icon: '⛰️', members: ['salma', 'yassine', 'omar', 'lina'], pinned: true, unread: 3, typing: 'Salma', balance: 260, totalSpent: 8420, last: { text: 'The riad just confirmed breakfast is included 🎉', time: '09:41', from: 'Salma' }, activity: '12 expenses · Nov 8–12' },
  { id: 'apartment', name: 'Apartment 4B', kind: 'Home', icon: '🏠', members: ['salma', 'omar'], unread: 0, balance: -230, totalSpent: 3120, last: { text: 'You settled up 230 MAD with Anas', time: 'Yesterday', from: 'You' }, activity: '4 expenses · this month' },
  { id: 'football', name: 'Friday Football', kind: 'Sport', icon: '⚽', members: ['yassine', 'anas', 'omar'], unread: 1, balance: 0, totalSpent: 960, last: { text: 'Pitch is booked for Friday 7pm', time: 'Yesterday', from: 'Yassine' }, activity: '6 expenses · weekly' },
  { id: 'salat', name: 'Salat Jomo3a', kind: 'Food', icon: '🥗', members: ['salma', 'yassine', 'lina'], unread: 0, muted: true, balance: 120, totalSpent: 1480, last: { text: 'Lina added “Friday lunch” · 240 MAD', time: 'Mon', from: 'Lina' }, activity: '9 expenses · Fridays' },
  { id: 'jomo', name: 'Jomo3qa Crew', kind: 'Social', icon: '🎉', members: ['anas', 'omar', 'lina'], unread: 0, balance: -60, totalSpent: 2210, last: { text: 'Photos from Saturday are up!', time: 'Sun', from: 'Omar' }, activity: '7 expenses · this month' },
  { id: 'test', name: 'Weekend in Essaouira', kind: 'Trip', icon: '🌊', members: ['salma'], unread: 0, archived: true, balance: 0, totalSpent: 1960, last: { text: 'All settled up. Thanks everyone!', time: 'Oct 28', from: 'Salma' }, activity: '11 expenses · settled' },
]

export const MESSAGES: Record<string, Msg[]> = {
  chefchaouen: [
    { id: 'm1', senderId: 'salma', text: 'Morning everyone! Train tickets to Tangier are booked — 180 MAD each, I put them on my card 🚄', time: '08:12', day: 'Today' },
    { id: 'm2', senderId: 'me', text: 'Amazing, thanks Salma! Adding my share now.', time: '08:14', mine: true, status: 'read' },
    { id: 'm3', senderId: 'salma', text: '', time: '08:15', kind: 'expense', expense: { title: 'Train tickets · Casa → Tangier', amount: 720, paidBy: 'Salma Idrissi', yourShare: 180, category: 'Transport' } },
    { id: 'm4', senderId: 'yassine', text: 'Found a riad in the medina with a rooftop — 1,200 MAD for 2 nights. Thoughts?', time: '08:32', reactions: [{ emoji: '❤️', by: ['Salma', 'Lina'] }, { emoji: '👍', by: ['You'] }] },
    { id: 'm5', senderId: 'lina', text: 'Rooftop at sunset in Chefchaouen?? Say less. Book it.', time: '08:33' },
    { id: 'm6', senderId: 'me', text: 'Booked. I’ll add the expense once they confirm.', time: '08:35', mine: true, status: 'read', replyTo: { name: 'Yassine Bennis', text: 'Found a riad in the medina with a rooftop…' } },
    { id: 'm7', senderId: 'system', text: 'Yassine pinned “Riad Dar Echchaouen — check-in Nov 8, 3pm”', time: '08:36', kind: 'system' },
    { id: 'm8', senderId: 'omar', text: 'I can drive from Tangier if we split fuel + tolls. Way cheaper than taxis.', time: '09:02' },
    { id: 'm9', senderId: 'me', text: '', time: '09:10', mine: true, kind: 'expense', expense: { title: 'Fuel + tolls · Tangier → Chefchaouen', amount: 340, paidBy: 'You', yourShare: 68, category: 'Transport' } },
    { id: 'm10', senderId: 'salma', text: 'The riad just confirmed breakfast is included 🎉', time: '09:41', pinned: true },
  ],
  apartment: [
    { id: 'a1', senderId: 'anas', text: 'Rent is due on the 5th — 4,500 total, so 1,500 each.', time: 'Mon 10:02', day: 'Monday' },
    { id: 'a2', senderId: 'me', text: 'Sent my share. Also paid the internet bill.', time: 'Mon 10:15', mine: true, status: 'read' },
    { id: 'a3', senderId: 'me', text: '', time: 'Mon 10:16', mine: true, kind: 'settlement', expense: { title: 'Settlement · You → Anas', amount: 230, paidBy: 'You', yourShare: 230, category: 'Settlement', settled: true } },
  ],
  football: [
    { id: 'f1', senderId: 'yassine', text: 'Pitch is booked for Friday 7pm. 240 total, 60 each — bring exact change or Splitify it.', time: 'Yesterday 18:20', day: 'Yesterday' },
    { id: 'f2', senderId: 'anas', text: 'In. Losing team buys mint tea after 🍵', time: 'Yesterday 18:24' },
  ],
  salat: [
    { id: 's1', senderId: 'lina', text: 'Friday lunch is on me this week — order by 11 so it arrives hot.', time: 'Mon 09:12', day: 'Monday' },
  ],
  jomo: [
    { id: 'j1', senderId: 'omar', text: 'Photos from Saturday are up! That sunset shot is unreal.', time: 'Sun 21:04', day: 'Sunday' },
  ],
  test: [
    { id: 't1', senderId: 'salma', text: 'All settled up. Thanks everyone — Essaouira was perfect 🌊', time: 'Oct 28', day: 'Oct 28' },
  ],
}

export const AI_ANSWERS: Record<string, string> = {
  default: 'Based on Chefchaouen Trip: you’ve spent 8,420 MAD as a group. Salma is owed 260 MAD overall, and the largest category is Transport (1,060 MAD). If everyone settles with Salma today, the trip is fully balanced.',
  who: 'Salma Idrissi is owed the most: 260 MAD (train tickets + riad deposit). You owe 68 MAD for fuel. One payment — you → Salma 68 MAD — settles your side completely.',
  settle: 'The fastest way to settle Chefchaouen Trip: Omar → Salma 92 MAD, Lina → Salma 84 MAD, you → Salma 68 MAD. That’s 3 payments instead of 7. Want me to draft reminders?',
  spend: 'Spending breakdown for Chefchaouen Trip — Transport 1,060 MAD (31%), Lodging 2,400 MAD (28%… wait, let me be precise: Lodging is the biggest at 2,400), Food 940 MAD, Activities 620 MAD. You’re tracking 12% under the 9,500 MAD budget.',
}
export const AI_SUGGESTIONS = ['Who owes whom?', 'How do we settle up fastest?', 'What did we spend on transport?', 'Draft a payment reminder']
export const QUICK_EMOJI = ['👍', '❤️', '😂', '🎉', '👀', '🙏']

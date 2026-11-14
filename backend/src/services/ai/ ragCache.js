// ==========================================================
// ragCache — cache ديال الـ RAG فـ الذاكرة (static variable)
//
// Map وحدة على مستوى الـ module: حيت Node كايعاود يستعمل
// نفس الـ module فـ كل require، هاد الـ Map كايشوفوها
// جميع الـ requests (بحال static variable فـ لغات اخرى).
//
// الشكل: Map { "groupId" -> { fingerprint, chunks, vectors } }
//
// التحديث:
//   ملي كايزيد شي عضو expense / settlement جديد، ولا كايتبدل
//   شي حاجة فـ الـ group، عيّط لـ ragCache.remove(groupId)
//   فـ الـ route ديالك. الكاش القديم كايتحيد، وأول سؤال
//   من بعد كايتحسب أوتوماتيك بالبيانات الجديدة.
// ==========================================================

const MAX_GROUPS = 200; // حدا بسيطة باش الذاكرة ما تطفاش

const cache = new Map();

function get(groupId) {
    return cache.get(String(groupId)) || null;
}

function set(groupId, data) {
    const key = String(groupId);

    // إلا وصلنا للحدا، حيد أقدم entry (أول واحد تدخل)
    if (!cache.has(key) && cache.size >= MAX_GROUPS) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
    }

    cache.set(key, data);
}

// كايتعيط ليها من routes ديال expense / settlement / members
function remove(groupId) {
    cache.delete(String(groupId));
}

// مسح كلشي (مفيد فـ tests أو إلا بغيتي تعاود من الصفر)
function clear() {
    cache.clear();
}

// للتشخيص
function stats() {
    return { groups: cache.size };
}

module.exports = { get, set, remove, clear, stats };
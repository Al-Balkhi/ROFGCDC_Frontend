# ROFGCDC Frontend

نظام إدارة النفايات - واجهة المستخدم الأمامية

## المتطلبات

- Node.js (الإصدار 18 أو أحدث)
- npm أو yarn

## التثبيت

1. استنسخ المستودع:
```bash
git clone <repository-url>
cd ROFGCDC_Frontend
```

2. ثبت التبعيات:
```bash
npm install
```

3. أنشئ ملف `.env` من `.env.example`:
```bash
cp .env.example .env
```

4. قم بتعديل ملف `.env` وأضف عنوان API الخاص بك:
```
VITE_BASE_API_URL=http://localhost:8000
```

## التشغيل

لتشغيل خادم التطوير:

```bash
npm run dev
```

سيتم فتح التطبيق على `http://localhost:5173`

## البناء للإنتاج

لإنشاء نسخة إنتاج:

```bash
npm run build
```

الملفات المبنية ستكون في مجلد `dist/`

## معاينة الإنتاج

لمعاينة النسخة المبنية:

```bash
npm run preview
```

## الميزات

- ✅ تسجيل الدخول والخروج
- ✅ تفعيل الحساب الأولي (OTP)
- ✅ إعادة تعيين كلمة المرور
- ✅ لوحة تحكم المدير
- ✅ إدارة المستخدمين (إنشاء، تعديل، أرشفة، استعادة، حذف)
- ✅ إدارة الحاويات
- ✅ إدارة الشاحنات
- ✅ سجل النشاطات
- ✅ الملف الشخصي (تعديل المعلومات وتغيير كلمة المرور)
- ✅ دعم اللغة العربية و RTL
- ✅ تصميم متجاوب (Desktop و Mobile)

## المتطلبات الخلفية

يجب أن يكون الخادم الخلفي (Django) يعمل ويوفر:

- JWT authentication في HTTP-only cookies
- CORS configured للسماح بالطلبات من frontend
- جميع endpoints المذكورة في API documentation

## API Endpoints المستخدمة

- `POST /api/auth/login/` - تسجيل الدخول
- `POST /api/auth/logout/` - تسجيل الخروج
- `POST /api/auth/initial-setup/request-otp/` - طلب OTP للتفعيل الأولي
- `POST /api/auth/initial-setup/confirm/` - تأكيد التفعيل الأولي
- `POST /api/auth/password/reset/request/` - طلب إعادة تعيين كلمة المرور
- `POST /api/auth/password/reset/confirm/` - تأكيد إعادة تعيين كلمة المرور
- `GET /api/profile/` - جلب الملف الشخصي
- `PUT /api/profile/` - تحديث الملف الشخصي
- `POST /api/profile/password/` - تغيير كلمة المرور
- `GET /api/users/` - قائمة المستخدمين (Admin)
- `POST /api/users/` - إنشاء مستخدم (Admin)
- `PATCH /api/users/{id}/` - تحديث مستخدم (Admin)
- `PATCH /api/users/{id}/archive/` - أرشفة مستخدم (Admin)
- `PATCH /api/users/{id}/restore/` - استعادة مستخدم (Admin)
- `DELETE /api/users/{id}/` - حذف مستخدم (Admin)
- `GET /api/bins/` - قائمة الحاويات (Admin)
- `POST /api/bins/` - إنشاء حاوية (Admin)
- `PATCH /api/bins/{id}/` - تحديث حاوية (Admin)
- `DELETE /api/bins/{id}/` - حذف حاوية (Admin)
- `GET /api/vehicles/` - قائمة الشاحنات (Admin)
- `POST /api/vehicles/` - إنشاء شاحنة (Admin)
- `PATCH /api/vehicles/{id}/` - تحديث شاحنة (Admin)
- `DELETE /api/vehicles/{id}/` - حذف شاحنة (Admin)
- `GET /api/admin/activity-log/` - سجل النشاطات (Admin)

## البنية

```
src/
├── components/          # المكونات القابلة لإعادة الاستخدام
│   ├── ProtectedRoute.jsx
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── Sidebar.jsx
│   ├── Drawer.jsx
│   ├── FormInput.jsx
│   ├── OTPInput.jsx
│   ├── AvatarUploader.jsx
│   ├── Table.jsx
│   └── Toast.jsx
├── routes/              # صفحات التطبيق
│   ├── Login.jsx
│   ├── Activate.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── AdminDashboard.jsx
│   ├── PlannerDashboard.jsx
│   ├── Profile.jsx
│   ├── Users.jsx
│   ├── Bins.jsx
│   ├── Vehicles.jsx
│   └── ActivityLog.jsx
├── store/               # إدارة الحالة (Zustand)
│   └── authStore.js
├── services/            # خدمات API
│   └── api.js
├── App.jsx              # مكون التطبيق الرئيسي
└── main.jsx             # نقطة الدخول
```

## الملاحظات

- جميع النصوص والواجهات باللغة العربية
- التطبيق يستخدم RTL (Right-to-Left) بشكل افتراضي
- JWT tokens مخزنة في HTTP-only cookies (آمن)
- فقط البيانات غير الحساسة (role, is_active) مخزنة في localStorage

## التطوير

للتطوير، تأكد من:
1. تشغيل الخادم الخلفي على المنفذ المحدد في `.env`
2. تكوين CORS في الخادم الخلفي للسماح بالطلبات من frontend
3. التأكد من أن جميع endpoints تعمل بشكل صحيح

## الترخيص

ISC

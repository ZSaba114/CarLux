import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../Pages/LoginPage.vue';
import AdminDashboard from '../Pages/AdminDashboard.vue';
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
 import ForgotPassword from '../Pages/ForgotPassword.vue';
 import MainUser from '../Pages/MainUser.vue';
  import SignupPage from '../Pages/SignupPage.vue';
    import UserDash from '../Pages/UserDash.vue';




const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: HomePage },
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/admin-dashboard', name: 'AdminDashboard', component: AdminDashboard },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword },
   { path: '/mainuser', name: 'MainUser', component: MainUser },
      { path: '/signup', name: 'signup', component: SignupPage },
      { path: '/user-dashboard', name: 'userdash', component: UserDash },



];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});


router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (to.path === "/admin-dashboard") {
    if (!user) return next("/login");

    const { db } = await import("../../firebaseConfig");

    // ✅ Firebase v9+ modulaire
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const userData = docSnap.exists() ? docSnap.data() : null;

    if (!userData || userData.role !== "admin") {
      return next("/login");
    }
  }

  next();
});


export default router;

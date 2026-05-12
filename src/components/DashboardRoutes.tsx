import { Routes, Route } from 'react-router-dom';
import type { User } from '../models/models';
import DashboardShell from '../components/DashboardShell';
import RoleRoute from '../components/RoleRoute';
import HomePage from '../pages/HomePage';
import InventoryPage from '../pages/InventoryPage';
import StaffPage from '../pages/admin/StaffPage';
import VendorsPage from '../pages/admin/VendorsPage';
import PurchaseInvoicesPage from '../pages/admin/PurchaseInvoicesPage';
import ReportsPage from '../pages/admin/ReportsPage';
import PartRequestsAdminPage from '../pages/admin/PartRequestsAdminPage';
import CustomersPage from '../pages/staff/CustomersPage';
import CustomerDetailPage from '../pages/staff/CustomerDetailPage';
import NewSalePage from '../pages/staff/NewSalePage';
import SalesPage from '../pages/staff/SalesPage';
import AppointmentsPage from '../pages/staff/AppointmentsPage';
import BrowsePartsPage from '../pages/customer/BrowsePartsPage';
import MyVehiclesPage from '../pages/customer/MyVehiclesPage';
import MyAppointmentsPage from '../pages/customer/MyAppointmentsPage';
import MyPartRequestsPage from '../pages/customer/MyPartRequestsPage';
import MyReviewsPage from '../pages/customer/MyReviewsPage';
import MyHistoryPage from '../pages/customer/MyHistoryPage';
import ProfilePage from '../pages/customer/ProfilePage';

type DashboardRoutesProps = {
  user: User;
};

const DashboardRoutes = ({ user }: DashboardRoutesProps) => {
  const isCustomer = user.role === 'Customer';

  return (
    <DashboardShell user={user}>
      <Routes>
        <Route index element={<HomePage user={user} />} />
        <Route path="inventory" element={<InventoryPage user={user} />} />
        <Route
          path="staff"
          element={
            <RoleRoute user={user} allow={['Admin']}>
              <StaffPage />
            </RoleRoute>
          }
        />
        <Route
          path="vendors"
          element={
            <RoleRoute user={user} allow={['Admin']}>
              <VendorsPage />
            </RoleRoute>
          }
        />
        <Route
          path="purchase-invoices"
          element={
            <RoleRoute user={user} allow={['Admin']}>
              <PurchaseInvoicesPage />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute user={user} allow={['Admin', 'Staff']}>
              <ReportsPage user={user} />
            </RoleRoute>
          }
        />
        <Route
          path="customers"
          element={
            <RoleRoute user={user} allow={['Admin', 'Staff']}>
              <CustomersPage />
            </RoleRoute>
          }
        />
        <Route
          path="customers/:id"
          element={
            <RoleRoute user={user} allow={['Admin', 'Staff']}>
              <CustomerDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="sales"
          element={
            <RoleRoute user={user} allow={['Admin', 'Staff']}>
              <SalesPage />
            </RoleRoute>
          }
        />
        <Route
          path="sales/new"
          element={
            <RoleRoute user={user} allow={['Admin', 'Staff']}>
              <NewSalePage />
            </RoleRoute>
          }
        />

        {/* Shared routes that switch by role */}
        <Route
          path="appointments"
          element={isCustomer ? <MyAppointmentsPage /> : <AppointmentsPage />}
        />
        <Route
          path="part-requests"
          element={isCustomer ? <MyPartRequestsPage /> : <PartRequestsAdminPage />}
        />

        {/* Customer-only routes */}
        <Route
          path="parts"
          element={
            <RoleRoute user={user} allow={['Customer']}>
              <BrowsePartsPage />
            </RoleRoute>
          }
        />
        <Route
          path="vehicles"
          element={
            <RoleRoute user={user} allow={['Customer']}>
              <MyVehiclesPage />
            </RoleRoute>
          }
        />
        <Route
          path="reviews"
          element={
            <RoleRoute user={user} allow={['Customer']}>
              <MyReviewsPage />
            </RoleRoute>
          }
        />
        <Route
          path="history"
          element={
            <RoleRoute user={user} allow={['Customer']}>
              <MyHistoryPage />
            </RoleRoute>
          }
        />
        <Route
          path="profile"
          element={
            <RoleRoute user={user} allow={['Customer']}>
              <ProfilePage />
            </RoleRoute>
          }
        />
      </Routes>
    </DashboardShell>
  );
};

export default DashboardRoutes;

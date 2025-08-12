
---

## File & Folder Explanations

### Root Files

- **App.css**: Global styles for the React application.
- **App.jsx**: Main React component; sets up routing and layout.
- **index.css**: Additional global styles.
- **main.jsx**: Entry point for the React app; renders `<App />` to the DOM.

---

### components/

Reusable and feature-specific React components.

- **AddProjectForm.jsx**: Form for adding new projects.
- **Equipment/**: Components for equipment management.
  - **EquipmentAddForm.jsx**: Form to add new equipment.
  - **StudentEquipment.jsx**: Displays equipment assigned to students.
  - **UserEquipmentList.jsx**: List of equipment for a user.
- **Expenses/**: Components for expense management.
  - **Allexpenses.jsx**: Displays all expenses.
  - **ExpenseAddForm.jsx**: Form to add a new expense.
- **FinanceBudget/**: Components for finance and budget management.
  - **FinanceBudgetAddForm.jsx**: Form to add finance/budget entries.
  - **FinanceBudgetList.jsx**: List of finance/budget records.
- **LandingPage.jsx**: The landing page of the application.
- **Leaves/**: Components for leave management.
  - **AllLeaves.jsx**: Displays all leave requests.
  - **CurrentUserLeaveList.jsx**: Shows current user's leave history.
  - **LeavesForm.jsx**: Form to apply for leave.
  - **StudentLeaves.jsx**: Displays student leave records.
- **Loader.jsx**: Loading spinner component.
- **MinutesOfMeeting/**: Components for meeting minutes.
  - **MinutesOfMeeting.jsx**: Displays minutes of meetings.
- **MinutesOfMeetingForm.jsx**: Form to add meeting minutes.
- **NavBar.jsx**: Navigation bar component.
- **Notification/**: Components for notifications.
  - **NotificationAddForm.jsx**: Form to add a notification.
  - **NotificationsList.jsx**: List of notifications.
- **RemaLoader.jsx**: Custom loader/spinner.
- **SimpleProjects/**: Components for project management.
  - **CurrentSubmissions.jsx**: Shows current project submissions.
  - **Projects.jsx**: List and manage projects.
  - **StudentProject.jsx**: Student-specific project view.
  - **UpdateProject.jsx**: Form to update project details.
- **Sponsor/**: Components for sponsorship management.
  - **AddSponsorshipForm.jsx**: Form to add a sponsor.
  - **DisplaySponsors.jsx**: List of sponsors.
- **Supervisor/**: Components for supervisor and student management.
  - **AddSupervisorForm.jsx**: Form to add a supervisor.
  - **Students.jsx**: List of students under a supervisor.
- **UserForm.jsx**: Form for user registration or editing.
- **Venues/**: Components for venue management.
  - **VenueAddForm.jsx**: Form to add a venue.
  - **VenueListComponent.jsx**: List of venues.

---

### pages/

Top-level pages for routing.

- **AdminPage.jsx**: Admin dashboard.
- **Faculty_dashboard.jsx**: Faculty dashboard.
- **ForgotPassword.jsx**: Password recovery page.
- **LoginPage.jsx**: Login page.
- **NotFoundPage.jsx**: 404 error page.
- **ResetPassword.jsx**: Password reset page.
- **SignUpPage.jsx**: User registration page.
- **Student_dashboard.jsx**: Student dashboard.

---

### redux/

Redux state management.

- **slices/**: Contains Redux slices for different state domains.
  - **themeSlice.js**: Manages theme (light/dark mode, etc.).
  - **userSlice.js**: Manages user authentication and profile state.
- **store.js**: Configures and exports the Redux store.

---

### styles/

CSS modules for styling components and pages, organized by feature.

- **AddSupervisorForm.css, AddUser.css, adminPage.css, FacultyDashboard.css, facultyEdit.css, ForgotPassword.css, HomePage.css, LandingPage.css, Loader.css, loginPage.css, NavBar.css, RemaLoader.css, ResetPassword.css**: Styles for respective components/pages.
- **Equipment/**: Styles for equipment-related components.
- **Expenses/**: Styles for expense-related components.
- **FinanceBudget/**: Styles for finance/budget components.
- **Leaves/**: Styles for leave-related components.
- **MinutesOfMeeting/**: Styles for meeting minutes.
- **Notification/**: Styles for notification components.
- **SimpleProject/**: Styles for project management.
- **Sponsor/**: Styles for sponsor components.
- **Student/**: Styles for student components.
- **Venues/**: Styles for venue components.

---

### utils/

- **api.js**: Utility functions for making API requests.

---

## Getting Started

1. Install dependencies:
    ```bash
    npm install
    ```
2. Start the development server:
    ```bash
    npm start
    ```
3. Build for production:
    ```bash
    npm run build
    ```

---


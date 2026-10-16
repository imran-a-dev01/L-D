# Prompt 1: Build an Enterprise L&D Intelligence Portal — NEXUS

## 1. Your Role
Act as a senior frontend engineer, enterprise UI/UX designer, design systems architect, and React specialist.
Build a premium, production-quality Learning & Development (L&D) Intelligence Portal named NEXUS | L&D Intelligence.
This is an enterprise application intended for real corporate use by an internal L&D team. It must look polished, trustworthy, modern, futuristic, highly usable, and impressive enough to demonstrate to managers and clients.
I have attached four reference screenshots. Use those screenshots as the primary design specification. Study their layout, proportions, typography, spacing, navigation, forms, tables, colours, and interactions before writing code.
Do not give me just a plan, a static design, or code snippets. Build the actual, runnable React frontend in the current project folder.

## 2. CRITICAL: Current Scope Is FRONTEND ONLY
The planned technology architecture is:
- Frontend: React + TypeScript.
- Future backend: Next.js.
- Future database: SQLite.

For this task, implement only the React frontend.
- Do NOT create the Next.js backend.
- Do NOT create API routes, server actions, database schemas, SQLite files, migrations, authentication servers, or database connections.
- Do NOT install or configure backend infrastructure.
- Do NOT spend time implementing a real authentication provider.
- Use realistic mock data and frontend state. Use localStorage for suitable demo persistence.
- Structure the frontend so that the mock data service can later be replaced with API calls to a Next.js backend without rewriting the entire UI.
- The current deliverable is a fully runnable, responsive, interactive frontend prototype.

## 3. Reference Screenshot Instructions — Extremely Important
The four attached screenshots represent these four experiences:
1. Admin Dashboard / Employee Skill Directory.
2. Create Employee Profile / Employee Details.
3. Technical Skills Management / Add Skill drawer.
4. NEXUS Secure Login page.

Treat them as visual references, not optional inspiration.
Match the overall visual design as closely as reasonably possible:
- Same light, premium corporate appearance.
- Similar top navigation and left sidebar.
- Similar page titles and content hierarchy.
- Similar wide data tables and rounded white cards.
- Similar blue primary buttons and outlined secondary buttons.
- Similar employee profile wizard.
- Similar skill category tabs and expandable skill sections.
- Similar right-side Add Skill drawer.
- Similar login card, pale-blue gradients and background artwork.
- Similar proportions, whitespace, alignment and typography.

Do not replace the reference design with a generic admin template.
Do not make the application dark-themed.
Do not omit important elements from the screenshots because you think a simpler layout is easier.
Use the first screenshot as the reference for the dashboard, the second for the employee editor, the third for skill management and the fourth for the login screen.

## 4. Technology Stack
Use:
- React.
- TypeScript.
- Vite if the project folder is empty or has no existing application setup.
- Tailwind CSS or a well-organized CSS architecture.
- Framer Motion for polished animations and transitions.
- Lucide React for general interface icons.
- Recharts for dashboard charts where appropriate.
- React Router for frontend navigation, if useful.

Use the current project's existing setup if it is already configured correctly. Inspect the project before modifying files.
Avoid unnecessary dependencies.
Use reusable components, typed data models, clean state management and consistent design tokens.

## 5. Brand and Visual Design
Application name:
NEXUS | L&D Intelligence

Tagline:
Skills. Growth. Opportunity.

Use this visual direction:
- Cloud white backgrounds.
- Pale ice-blue surfaces.
- Deep navy text.
- Electric blue primary actions.
- Blue-to-cyan accent gradients.
- Green success indicators.
- Amber warning indicators.
- Thin, subtle borders.
- Soft, realistic shadows.
- Rounded cards and input fields.
- Premium typography similar to Inter.
- A clean and spacious enterprise layout.

Suggested colour tokens:
- Primary navy: #0B1B4D
- Primary blue: #1265FF
- Light background: #F7FAFF
- Secondary text: #64748B
- Success: #13B981
- Warning: #F59E0B
- Border: #E3EAF5

### Glassmorphism and visual effects
Implement tasteful glassmorphism, not excessive transparency.
Use backdrop blur, translucent white surfaces, subtle blue gradients, fine borders and layered depth for:
- The login card.
- Header elements where appropriate.
- Selected dashboard overlays.
- Dropdown menus and popovers.
- Modal windows.
- The Add Skill side drawer.
- Notification panels.

Use restrained neumorphic depth only where it improves visual hierarchy.
Keep the employee table, form labels, input values and data dense enough to remain readable.
Add elegant wave-shaped background artwork and soft gradient illumination to the login screen, similar to the reference.
Avoid excessive glow, neon colours, huge decorative graphics, dark backgrounds or unnecessary floating objects.
The final result must look like a mature enterprise SaaS application, not a gaming dashboard.

## 6. Page 1 — Secure NEXUS Login
Recreate the attached login screenshot as closely as possible.
### Layout
Create a spacious desktop split layout.
**Left section:**
- NEXUS logo and L&D Intelligence brand.
- “Skills. Growth. Opportunity.” heading.
- Supporting description about workforce capabilities and learning readiness.
- Feature 1: Secure workforce data.
- Feature 2: Verified skill profiles.
- Feature 3: Role-based access.
- Subtle decorative skill growth chart or workforce analytics illustration.
- Light-blue gradient waves and glassmorphism details.

**Right section:**
- Premium white glass-style login card.
- NEXUS branding.
- “Welcome back” heading.
- Work Email input.
- Password input with show/hide toggle.
- Remember this device checkbox.
- Forgot password link.
- “Sign in securely” primary button.
- Small organization-managed-access footer.

### Login interactions
For the current frontend demo:
- Validate that email and password are populated.
- Display inline validation errors.
- Show a loading state when signing in.
- On successful demo sign-in, navigate to the Admin Dashboard.
- Display a friendly error message for incomplete form input.
- Support password visibility toggle.
- Implement a demo-only authentication flow without a real backend.
- Do not imply that frontend-only demo authentication provides production security.
- The design must not expose hardcoded production credentials.

## 7. Page 2 — Admin Dashboard / Employee Skill Directory
This is the main application screen after the demo login.
### Global application shell
Recreate the structure in the first reference screenshot.
**Top navigation:**
- NEXUS logo.
- L&D Intelligence label.
- Global search input.
- Keyboard shortcut hint such as Ctrl + K.
- Notifications icon with an unread indicator.
- Application launcher icon.
- Admin avatar and account dropdown.

**Left sidebar:**
- Overview.
- Employee Directory.
- Skill Intelligence.
- Skill Taxonomy.
- Learning Insights.
- Access & Roles.
- Settings.

Use consistent line icons, active navigation highlights, subtle hover backgrounds, appropriate spacing and smooth active-state transitions.
The sidebar should collapse into a compact navigation layout on smaller screens.

### Dashboard title
Display:
Employee Skill Directory
Supporting text:
“Manage workforce capabilities, proficiency and deployment readiness.”

### KPI cards
Create four polished KPI cards:
- Total Employees.
- Profiles Complete.
- Skills Tracked.
- Learning Priorities.

Each card should have:
- A distinct icon.
- A prominent value.
- A supporting description.
- A subtle trend indicator.
- A light coloured icon container.
- A refined hover interaction.
- Use consistent, realistic mock data. Do not create misleading calculations: wherever possible, derive the counts and percentages from the mock employee dataset.

### Skill coverage snapshot
Add a right-side or upper-right card with horizontal progress bars for:
- Frontend.
- Backend.
- Cloud.
- Data.
- Domain.
Use different restrained accent colours and percentage labels.
Make the proportions and styling similar to the supplied dashboard reference.

### Employee filters
Create a horizontal filter bar containing:
- Search by employee name, ID or skills.
- Practice dropdown.
- Location dropdown.
- Proficiency dropdown.
- Profile Status dropdown.
- More Filters button.
- Add Employee primary button.

The dropdowns must be functional and populated from available mock data or controlled option lists.
Search and filters must update the employee grid rather than merely changing the selected dropdown label.

### Employee data grid
Create a professional, dense but readable table with these columns:
- Employee ID.
- Employee Name.
- Designation / Grade.
- Business Unit / Practice.
- Reporting Manager.
- Current Project.
- Location.
- Total Experience.
- Primary Skills.
- Profile Completion.
- Updated.
- Row Actions.

Include:
- Initial-based employee avatars.
- Employee ID and email.
- Skill chips.
- Completion progress bars.
- Profile completeness indicators.
- Location icons.
- Row action menus.
- Selectable checkboxes.
- Table/Card view toggle.
- Pagination.
- Export button with a functioning client-side CSV export if feasible.

Use fictional employee records, not real personal information.
Seed the frontend with enough mock employees to demonstrate realistic filtering, sorting and pagination.
Do not make the interface appear broken when searches return zero results. Provide an attractive empty state with a reset-filters action.

### Dashboard interactions
- Clicking Add Employee opens the Create Employee Profile page.
- Clicking an employee opens that employee's profile.
- Row action menus should include meaningful actions such as View Profile and Edit Profile.
- Table/Card toggle should actually change the display.
- Search must work.
- Filters must work.
- Pagination must work.
- Export must download a file or provide meaningful feedback.
- Notifications, search and account controls should open functional popovers or panels.

## 8. Page 3 — Create Employee Profile
Recreate the second reference screenshot.
Page title:
Create employee profile
Supporting text:
“Capture role context, delivery experience and deployable skills.”

Place Save Draft and Save Profile buttons in the upper-right.
Create a multi-step form with four steps:
1. Employee Details.
2. Technical Skills.
3. Domain Expertise.
4. Review.

Use a horizontal stepper with an active blue step, completed indicators and a connected progress line.
The employee details section should appear in a large white rounded card. Use a clean two-column form layout on desktop.
All fields below must be available in the interface.

### Step 1 — Employee Details
Employee information fields:
- Employee ID.
- Employee Name.
- Email Address.
- Designation / Grade.
- Business Unit / Practice.
- Reporting Manager Email.
- Current Project.
- Current Customer.
- Location.
- Total Experience (Years).
- Current Role (Not Deployable).
- Designation as per OwlSure.
- Deployable Roles.

Use appropriate components for each field:
- Employee ID: text field with unique-ID validation in the frontend demo.
- Employee Name: text input.
- Email Address: email input.
- Designation / Grade: searchable dropdown.
- Business Unit / Practice: dropdown.
- Reporting Manager Email: searchable dropdown or email input.
- Current Project: searchable dropdown.
- Current Customer: searchable dropdown.
- Location: dropdown.
- Total Experience: numeric input accepting sensible decimal values such as 2.5.
- Current Role (Not Deployable): dropdown.
- Designation as per OwlSure: dropdown.
- Deployable Roles: searchable multi-select with removable chips.

Make all dropdown options easy to maintain in a separate configuration file.
Use sensible demo options rather than hardcoding dropdown values into multiple components.
Add helper text where appropriate.
Respect the note from the original spreadsheet: Current Role (Not Deployable) is entered once per employee, and employees cannot edit it during the first phase.
This is currently an Admin application, so Admin can manage the field.

### Step 2 — Technical Skills
Use category tabs or a closely matching section layout:
- Frontend.
- Backend.
- Database.
- Cloud.
- Data.
- DevOps & Tools.

Allow skills to be added, edited and removed.
For each technical skill, support:
- Skill / Technology.
- Experience (Years).
- Proficiency.
- Last Used (Month / Year).

Also support Last Project and Specialization where useful to match the richer reference skill editor.
Include:
- Add Skill button.
- Editable skill rows.
- Skill-specific icons.
- Proficiency badges or dropdowns.
- Month/year selection.
- Delete confirmation.
- Duplicate-skill prevention within the same category.

The initial categories must include these technologies and options from the Excel reference:
- Frontend: React / React.js, Next.js, Angular.
- Backend: Java, .NET, Node.js.
- Database: SQL Server, Oracle, PostgreSQL, MySQL, Others.
- Cloud Skills: AWS, Azure, GCP, Containers.
- DevOps Skills: Jenkins, ADO / Azure DevOps, Other DevOps technologies as required.
- Data: Snowflake, Databricks.

Provide a sensible way to add another technology to an appropriate category without modifying the source code.

#### Skill proficiency options
Use a consistent set of options:
- Beginner.
- Intermediate.
- Advanced.
- Expert.
Use tasteful visual distinctions for proficiency without relying on colour alone.

### Step 3 — Domain Expertise
Create a separate domain expertise section.
Categories:
- Insurance.
- Banking.
- Healthcare.
- Others.

Each domain expertise entry should contain:
- Domain.
- Experience (Years).
- Proficiency.
- Last Used (Month / Year).
- Last Project.
- Specialization.

Allow multiple domain expertise entries.
When Others is selected, display a field to specify the custom domain.

### Step 4 — Review
Display a clean review page summarizing:
- Employee Details.
- Technical Skills.
- Domain Expertise.
- Immediate Technologies.
- Learning Technologies.

Allow the Admin to return to previous steps to correct information.
Use clear validation messages for required fields and invalid entries.
Show a success toast or confirmation state after a successful demo save.

### Save behaviour
- Save Draft stores the current form state locally.
- Save Profile validates the data before saving.
- Saved profiles should appear in the dashboard directory.
- Editing a profile should load its existing data.
- Changes must be reflected consistently throughout the frontend.
- Prevent duplicate Employee IDs.
- Do not silently discard unsaved user changes.

## 9. Page 4 — Technical Skills Management
Recreate the third reference screenshot.
Create a dedicated Skill Intelligence / Technical Skills page.
The page should contain:
- Left navigation.
- Global header.
- Technical Skills page title.
- Profile completeness indicator.
- Auto-saved or saved-state indicator for local changes.
- Category tabs.
- Editable skill table.
- Add Skill button.
- Expandable skill-category sections.

Use sections for:
- Frontend Skills.
- Backend Skills.
- Database Skills.
- Cloud Skills.
- Data Skills.
- DevOps & Tools Skills.
- Domain Expertise.
Allow the Admin to expand or collapse sections.

### Add Skill drawer
When Add Skill is clicked, open a polished right-side drawer similar to the third screenshot.
Fields:
- Skill Category.
- Technology / Skill.
- Proficiency.
- Experience (Years).
- Last Used (Month / Year).
- Last Project.
- Specialization.

Interactions:
- Category selection filters the available skills.
- Technology selection uses a searchable dropdown.
- The Admin can add a new technology if it is not already registered.
- Validate required fields.
- Display helpful errors.
- Cancel closes the drawer.
- Add to Profile adds the skill to the selected employee.
- Prevent duplicate skills.
- Update the visible table immediately.
- Preserve edits in frontend state and localStorage.
- Use subtle drawer-slide animation and backdrop blur, matching the reference.

## 10. Skill Icons — Use skillicons.dev
Use this website as the primary source for technology icons:
https://skillicons.dev/
Create a dedicated reusable skill-icon component and a central skill icon registry.
Requirements:
- Render recognised technology icons from skillicons.dev.
- Use the website's supported icon slugs and an alias map for technology names.
- Normalise names and aliases where appropriate. For example, React / React.js should resolve to the same React icon.
- Render individual icons, not one large combined image for an entire row.
- Keep an icon next to the technology name in dropdown options, tables, chips and skill cards where it improves usability.
- Ensure icons have an appropriate size, aspect ratio and accessible alternative text.
- Add image-loading and image-error handling.
- If an icon is unavailable or its URL fails, gracefully show a suitable Lucide fallback icon instead of a broken image.

### Dynamic skill addition
When an Admin adds a new technology through the UI:
- Save the technology name in frontend state.
- Make it available in the appropriate category's skill dropdown.
- Make it available in subsequent skill entries.
- Try to resolve the icon using a known skillicons.dev slug or alias.
- If there is no supported icon, use a sensible category-specific fallback icon.
- Keep the technology usable even if no logo exists.
- Keep the initial technology list and icon mappings in a maintainable configuration module.
- Do not create an icon URL from an arbitrary skill name without error handling.
- Do not make skill creation depend on successful icon loading.

## 11. Additional Technologies and Learning Interests
Preserve the fields:
- Immediate Technologies.
- Learning Technologies.

Implement them as searchable multi-select controls with removable chips.
The Admin should be able to select available technologies or add a custom technology through the UI.
Use the same technology registry and icon-resolution mechanism where appropriate.
Keep the difference between skills the employee already uses and technologies they are currently learning clear.

## 12. Frontend Data and State Architecture
Use TypeScript interfaces or types for:
- Employee.
- TechnicalSkill.
- DomainExpertise.
- DeployableRole.
- Technology.
- ProficiencyLevel.
- EmployeeProfileStatus.

Separate the project into well-organised modules:
- Reusable components: Button, Input, Select, MultiSelect, Modal, Drawer, Toast, Stepper, SkillIcon, KpiCard, EmployeeTable, CommandPalette.
- Use service abstraction so mock storage can later be replaced with API client.
- Use React state and localStorage for persistence.

## 13. Animations and Micro-interactions
- Framer Motion / CSS transitions for page switches, drawer slide-in, modal fade, hover elevation, and tabs.
- Respect reduced-motion preferences.

## 14. Responsive Design
- Desktop first (1536×1024, 1440×900, 1366×768), also responsive on tablets and mobile.

## 15. Accessibility and Quality
- Semantic HTML, clean focus indicators, proper TypeScript types, no console errors.

## 16. Strict Scope Restrictions
- Frontend ONLY. No Next.js backend, no SQLite database, no real auth servers in this phase.

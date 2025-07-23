import {
    Home as HomeIcon,
    Users as UsersIcon,
    Book as BookIcon,
    ClipboardList as ClipboardListIcon,
    Calendar as CalendarIcon,
    Settings as SettingsIcon,
    DollarSign as DollarSignIcon,
    MessageSquare as MessageSquareIcon,
    FileBarChart as FileBarChartIcon,
    Bus as BusIcon,
    School as SchoolIcon,
    Library as LibraryIcon
} from "lucide-react";
  
import React, { ReactElement } from "react";
  
export type MenuItem = {
    label: string;
    icon: ReactElement; // More precise type
    children?: string[];
};

type RoleMenus = {
    [role: string]: MenuItem[];
};


export const roleMenus: RoleMenus = {
    admin: [
        { label: "Dashboard", icon: React.createElement(HomeIcon) },
        { label: "Students", icon: React.createElement(UsersIcon), children: ["Admissions", "Student List", "Attendance", "Disciplinary Records"] },
        { label: "Teachers & Staff", icon: React.createElement(UsersIcon), children: ["Staff List", "Assign Roles", "Attendance", "Payroll"] },
        { label: "Classes & Subjects", icon: React.createElement(BookIcon), children: ["Class Management", "Subject Allocation", "Timetable", "Promotions"] },
        { label: "Examinations", icon: React.createElement(ClipboardListIcon ), children: ["Exam Setup", "Marks Entry", "Result Processing", "Report Cards"] },
        { label: "Finance", icon: React.createElement(DollarSignIcon), children: ["Fee Structure", "Invoices & Payments", "Discounts / Scholarships", "Expenses"] },
        { label: "Library", icon: React.createElement(LibraryIcon), children: ["Books Inventory", "Issue/Return", "Fines"] },
        { label: "Transportation", icon: React.createElement(BusIcon), children: ["Bus Routes", "Assign Students", "Drivers & Vehicles"] },
        { label: "Hostel", icon: React.createElement(SchoolIcon), children: ["Room Allocation", "Resident Students", "Hostel Fees"] },
        { label: "Communication", icon: React.createElement(MessageSquareIcon), children: ["Announcements", "Messages", "Email / SMS"] },
        { label: "Reports", icon: React.createElement(FileBarChartIcon), children: ["Student Reports", "Staff Reports", "Finance Reports", "Custom Reports"] },
        { label: "Settings", icon: React.createElement(SettingsIcon), children: ["Academic Year", "Roles & Permissions", "System Config"] }
    ],
    teacher: [
        { label: "Dashboard", icon: React.createElement(HomeIcon) },
        { label: "My Students", icon: React.createElement(UsersIcon), children: ["Student List", "Attendance", "Remarks"] },
        { label: "Class & Subjects", icon: React.createElement(BookIcon), children: ["Timetable", "Subject Materials", "Assignments"] },
        { label: "Exams & Results", icon: React.createElement(ClipboardListIcon), children: ["Enter Marks", "View Results", "Comment Sheets"] },
        { label: "Communication", icon: React.createElement(MessageSquareIcon), children: ["Messages", "Announcements"] },
        { label: "Resources", icon: React.createElement(CalendarIcon), children: ["Calendar", "Teaching Materials"] }
    ],
    parent: [
        { label: "Dashboard", icon: React.createElement(HomeIcon) },
        { label: "My Child", icon: React.createElement(UsersIcon), children: ["Attendance", "Report Cards", "Timetable", "Disciplinary Records"] },
        { label: "Finance", icon: React.createElement(DollarSignIcon), children: ["Fee Statements", "Payment History", "Pay Fees"] },
        { label: "Communication", icon: React.createElement(MessageSquareIcon), children: ["Messages", "Announcements", "Meeting Requests"] },
        { label: "Resources", icon: React.createElement(CalendarIcon), children: ["Calendar", "Homework / Assignments"] }
    ],
    student: [
        { label: "Dashboard", icon: React.createElement(HomeIcon) },
        { label: "My Class", icon: React.createElement(BookIcon), children: ["Subjects", "Timetable", "Assignments"] },
        { label: "Exams & Results", icon: React.createElement(ClipboardListIcon), children: ["Exam Schedule", "Results", "Report Card"] },
        { label: "Attendance", icon: React.createElement(CalendarIcon), children: ["Monthly View", "Absence Records"] },
        { label: "Library", icon: React.createElement(LibraryIcon), children: ["Borrowed Books", "Due Dates"] },
        { label: "Communication", icon: React.createElement(MessageSquareIcon), children: ["Messages", "Announcements"] }
    ]
};
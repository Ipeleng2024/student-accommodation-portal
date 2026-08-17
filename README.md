# 🤖 AI-Powered Student Accommodation Portal

A full-stack student accommodation web application that combines modern web development with **AI-powered assistance, intelligent automation, and secure application design**.

The platform is designed to make student accommodation management more efficient by giving tenants access to an AI-powered assistant while automating repetitive administrative workflows for accommodation managers.

---

## 📌 Project Overview

Managing student accommodation involves repetitive tasks such as answering tenant questions, handling complaints, communicating important information, checking room availability, and processing routine requests.

This project explores how **Artificial Intelligence and workflow automation can be integrated directly into a real-world web application** to reduce repetitive manual work and improve the tenant experience.

The application combines:

* 🌐 Full-stack web development
* 🤖 Artificial Intelligence
* 💬 AI-powered chatbot
* ⚙️ AI workflow automation
* 🔄 Automated business processes
* 🔐 Secure application development
* ☁️ Cloud-ready architecture

The main focus of the project is not simply building an accommodation website, but demonstrating how AI can be used to make a traditional web application more intelligent and automated.

---

# 🏠 Current Features

## Public Accommodation Portal

The current version provides a public-facing accommodation portal where prospective tenants can explore available rooms.

Users can:

* View accommodation properties
* View rooms across multiple properties
* Check room availability
* View room prices
* View room types
* View floor information
* View property information
* Identify available and occupied rooms

The room board provides a visual overview of room availability across the properties.

---

# 🤖 AI-Powered Chatbot

One of the main features of the platform is an **AI-powered tenant chatbot**.

The chatbot is being designed to provide tenants with immediate assistance without requiring accommodation staff to manually answer every basic enquiry.

The planned AI implementation will use an AI service such as the **Google Gemini API**.

The chatbot can assist with tasks such as:

* Answering accommodation FAQs
* Explaining payment procedures
* Providing room information
* Assisting with room-viewing requests
* Explaining accommodation policies
* Helping tenants submit complaints
* Providing information about common tenant processes
* Guiding users through the platform
* Escalating more complex requests to management

The chatbot is intended to be integrated directly into the application rather than functioning as a separate AI tool.

---

# 🧠 AI-Powered Automation

AI is a major component of this project.

Beyond the chatbot, the application will explore how AI can be used to **automate repetitive accommodation management workflows**.

For example, when a tenant submits a complaint, the system could use AI to understand and categorize the request before triggering an automated workflow.

### Example

```text
Tenant submits complaint
        │
        ▼
Web Application
        │
        ▼
AI analyzes complaint
        │
        ├── Category
        ├── Priority
        └── Summary
        │
        ▼
Automation Workflow
        │
        ▼
Manager Notification
        │
        ▼
Complaint Processed
```

AI could categorize requests such as:

* Maintenance
* Payment
* Security
* Noise
* Room-related issues
* General enquiries
* Emergency-related issues

This allows repetitive tasks to be processed automatically while allowing human staff to handle situations that require human judgement.

---

# ⚙️ Workflow Automation

The project will also integrate external automation tools such as **Zapier** to connect application events with automated actions.

Potential automation workflows include:

### Tenant Notifications

```text
Application Event
       ↓
Automation Trigger
       ↓
Workflow Processing
       ↓
Tenant Notification
```

Examples include:

* Payment reminders
* Complaint updates
* Room availability notifications
* Application updates
* Important accommodation announcements
* Tenant onboarding messages

### Manager Notifications

```text
Tenant Request
       ↓
AI Processing
       ↓
Priority Determined
       ↓
Automation Trigger
       ↓
Manager Alert
```

This creates an event-driven workflow where the application can automatically respond to common events.

---

# 💬 AI Chatbot + Automation

The chatbot and automation systems are designed to work together.

For example:

```text
                  Tenant
                     │
                     ▼
              Web Application
                     │
                     ▼
                AI Chatbot
                     │
                     ▼
                Gemini API
                     │
                     ▼
             Application Logic
                     │
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
       Direct Answer      Automation
                              │
                              ▼
                            Zapier
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                 Email     Manager    Notification
                            Alert
```

The objective is to demonstrate an end-to-end AI workflow:

**User → Web Application → AI → Application Logic → Automation → Action**

---

# 🔐 Security

Security is an important part of the project because the application will handle user accounts, tenant information, complaints, accommodation information, and AI interactions.

Security considerations include:

* Secure authentication
* Password hashing
* Role-Based Access Control (RBAC)
* API authorization
* Input validation
* Secure session/token management
* Protection against common web vulnerabilities
* Secure API design
* Audit logging
* Protection of personally identifiable information (PII)
* Secure handling of API keys and secrets

---

## 🛡️ AI Security

Because AI will be integrated into the application's workflows, the project will also consider security risks specific to AI applications.

These include:

* Prompt injection
* Sensitive information exposure
* Unauthorized access to application information
* Manipulation of AI instructions
* Unsafe AI-generated actions
* Excessive AI permissions
* Malicious user input
* Insecure automation triggers

AI will therefore be treated as an application component that requires security controls rather than simply adding an AI chatbot to the frontend.

---

# 🏗️ Application Architecture

The application follows a client-server architecture with an AI and automation layer.

```text
                 ┌──────────────────────┐
                 │      Web Client       │
                 │   Tenant / Manager   │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    Express Backend   │
                 │       REST API       │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        Application       AI Layer    Authentication
          Logic         Gemini API       & RBAC
              │             │
              │             ▼
              │        AI Chatbot
              │
              ▼
        Automation Layer
              │
              ▼
            Zapier
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
     Email  Alerts  Notifications
```

This architecture allows AI and automation functionality to remain integrated with the core application while maintaining separation between different components.

---

# 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js
* REST APIs

### Artificial Intelligence

* Google Gemini API
* AI-powered chatbot
* Prompt engineering
* AI-assisted classification
* AI workflow automation

### Automation

* Zapier
* Event-driven workflows
* Automated notifications
* AI-assisted workflow processing

### Security

* Authentication
* Authorization
* Role-Based Access Control
* Password hashing
* Input validation
* Secure API design
* AI security considerations
* API secret management

### Development

* Visual Studio Code
* Git
* GitHub
* npm

---

# 📁 Project Structure

```text
student-accommodation-portal/
│
├── data/
│   └── properties.json
│
├── public/
│   ├── index.html
│   ├── tenant-login.html
│   ├── manager-login.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       └── main.js
│
├── routes/
│   └── public.js
│
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

---

# 🔌 API

### Public Summary

```http
GET /api/public/summary
```

Returns a summary of accommodation information used by the public portal.

### Properties

```http
GET /api/public/properties
```

Returns property and room information used by the frontend.

---

# 🚀 Running the Project

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Navigate into the project

```bash
cd student-accommodation-portal
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the application

```bash
npm start
```

### 5. Open the application

```text
http://localhost:3000
```

---

# 🔮 AI Development Direction

The long-term focus of the project is to demonstrate how AI can be embedded into a practical web application rather than used as an isolated feature.

The application will explore:

* AI-powered conversational assistance
* AI-based request classification
* AI-generated summaries
* AI-assisted tenant support
* Automated notifications
* AI-triggered workflows
* Automated complaint processing
* Intelligent task routing
* Human-in-the-loop workflows
* Secure AI integration

The project will use **Google Gemini** as the initial AI platform while keeping the application architecture flexible enough to support other AI services in the future.

---

# 🎯 Project Focus

This project demonstrates the integration of:

**Web Development + AI + Automation + Cybersecurity**

The objective is to build a practical application where AI doesn't simply generate text, but actively contributes to the application's workflows and helps automate real-world tasks.

---

# 👩🏽‍💻 Author

**Dini Vumijojo**

Information Technology Student
Cybersecurity • Cloud Security • DevSecOps • AI Development

---

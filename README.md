# House-By-Us 🇿🇼

House-By-Us is a polished, highly authenticated, three-sided web and mobile marketplace engineered to help tertiary students in Harare, Zimbabwe find verified boarding houses near their universities (e.g., UZ, HIT, Chinhoyi University placeholders, MSUB). 

The platform optimizes the student accommodation hunt by streamlining property mapping, providing robust verification queues for admins, and delivering scalable monetization and multi-channel communication systems for landlords.

---

## 🚀 Key Features

### 👨‍🎓 Students (No Auth required to browse, Auth required to connect)
- **Advanced Map-First Search:** Split-screen map/grid search engine filtering by price, room layout (Single/Shared), and highly localized infrastructure requirements (Borehole water, Solar backup power, Wi-Fi).
- **Rich Media Galleries:** Smooth image/video lightboxes with progressive loading for fast performance on mobile connections.
- **One-Click Connections:** Securely request callbacks, view verified contact options, or initiate instant WhatsApp chats with landlords.

### 🏡 Landlords
- **Intuitive Onboarding:** Streamlined onboarding requiring identity clearance and structure setup for local payment channels (Ecocash, Paynow, or global cards).
- **Multi-Step Media Submissions:** Drag-and-drop file upload engine processing raw media directly to AWS S3 buckets via secure presigned URLs.
- **Monetization Engine:** Premium listing bumps ("Top of Search" visibility placement, "Verified Badge" tiers) integrated with transactional monetization workflows.

### 🛡️ Admins
- **Verification Dashboard:** A dedicated interface displaying incoming properties side-by-side with coordinates validation, metadata, and media checkers.
- **Auditing Logs:** Approve or reject listings with mandatory feedback loops that automatically dispatch push/email notifications back to landlords.
- **Platform Analytics:** Visual metrics tracking platform volume, total revenue distribution, registration velocity, and geographical dense-zones inside Harare.

---

## 🛠️ Architecture & Tech Stack

The architecture is organized as an end-to-end type-safe TypeScript Monorepo powered by `pnpm`.

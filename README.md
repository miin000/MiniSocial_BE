# MiniSocial Backend

Backend API for **MiniSocial** built with **NestJS**.

This project provides REST APIs for the MiniSocial application, handling user management, authentication, posts, and other social features.

---

## Tech Stack

- NestJS
- Node.js
- TypeScript
- REST API
- npm

---

## Installation

Clone the repository:

```bash
git clone https://github.com/miin000/MiniSocial_BE.git
cd MiniSocial_BE
```

Install dependencies:

```bash
npm install
```

---

## Running the app

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run start:prod
```

Default server:

```
http://localhost:3000
```

---

## Project Structure

```
src/
 ├── auth/        # Authentication module
 ├── users/       # User management
 ├── posts/       # Posts / social content
 ├── common/      # Shared utilities, guards, decorators
 ├── app.module.ts
 └── main.ts
```

---

## API Example

```
GET /users
POST /auth/login
POST /posts
```

---

## Development

Run in watch mode:

```bash
npm run start:dev
```

Build project:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

---

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Open a Pull Request

---

## License

MIT License
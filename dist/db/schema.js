"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasks = exports.taskStatusEnum = exports.users = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['user', 'admin']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    role: (0, exports.userRoleEnum)('role').notNull().default('user'),
    isVerified: (0, pg_core_1.boolean)('is_verified').notNull().default(false),
    verificationToken: (0, pg_core_1.text)('verification_token'),
    verificationTokenExpiresAt: (0, pg_core_1.text)('verification_token_expires_at'),
    resetToken: (0, pg_core_1.text)('reset_token'),
    resetTokenExpiresAt: (0, pg_core_1.text)('reset_token_expires_at'),
    refreshTokenHash: (0, pg_core_1.text)('refresh_token_hash'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.taskStatusEnum = (0, pg_core_1.pgEnum)('task_status', [
    'todo',
    'in_progress',
    'done',
]);
exports.tasks = (0, pg_core_1.pgTable)('tasks', {
    id: (0, pg_core_1.uuid)().defaultRandom().primaryKey(),
    title: (0, pg_core_1.text)('title').notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, exports.taskStatusEnum)('status').notNull().default('todo'),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map
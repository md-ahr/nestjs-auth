"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
let TasksService = class TasksService {
    async findAllForUser(userId) {
        return db_1.db.query.tasks.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId) });
    }
    async create(userId, dto) {
        const [task] = await db_1.db
            .insert(schema_1.tasks)
            .values({ ...dto, userId })
            .returning();
        return task;
    }
    async update(id, userId, data) {
        const task = await db_1.db.query.tasks.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.tasks.id, id) });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.userId !== userId) {
            throw new common_1.ForbiddenException('You do not own this task');
        }
        const [updatedTask] = await db_1.db
            .update(schema_1.tasks)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.id, userId)))
            .returning();
        return updatedTask;
    }
    async delete(id, userId) {
        const task = await db_1.db.query.tasks.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.tasks.id, id) });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (task.userId !== userId) {
            throw new common_1.ForbiddenException('You do not own this task');
        }
        await db_1.db.delete(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, id));
        return { message: 'Task deleted successfully' };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)()
], TasksService);
//# sourceMappingURL=tasks.service.js.map
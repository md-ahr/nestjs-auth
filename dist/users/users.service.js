"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
let UsersService = class UsersService {
    async findByEmail(email) {
        return db_1.db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.users.email, email) });
    }
    async findById(id) {
        return db_1.db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.users.id, id) });
    }
    async findByResetToken(token) {
        return db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.resetToken, token),
        });
    }
    async findByVerificationToken(token) {
        return db_1.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.verificationToken, token),
        });
    }
    async create(data) {
        const [user] = await db_1.db.insert(schema_1.users).values(data).returning();
        return user;
    }
    async update(id, data) {
        const [user] = await db_1.db
            .update(schema_1.users)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return user;
    }
    async findAll() {
        return db_1.db.query.users.findMany();
    }
    async delete(id) {
        await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map
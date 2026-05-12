import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from 'src/db';
import { type NewUser, users } from 'src/db/schema';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  }

  async findById(id: string) {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async findByResetToken(token: string) {
    return db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });
  }

  async findByVerificationToken(token: string) {
    return db.query.users.findFirst({
      where: eq(users.verificationToken, token),
    });
  }

  async create(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async findAll() {
    return db.query.users.findMany();
  }

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}

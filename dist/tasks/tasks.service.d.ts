import { CreateTaskDto } from './dto/create-task.dto';
export declare class TasksService {
    findAllForUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: "todo" | "in_progress" | "done";
        userId: string;
    }[]>;
    create(userId: string, dto: CreateTaskDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: "todo" | "in_progress" | "done";
        userId: string;
    }>;
    update(id: string, userId: string, data: Partial<CreateTaskDto>): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "todo" | "in_progress" | "done";
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string, userId: string): Promise<{
        message: string;
    }>;
}

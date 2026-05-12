import type { User } from "../db/schema";
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    findAll(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: "todo" | "in_progress" | "done";
        userId: string;
    }[]>;
    create(user: User, dto: CreateTaskDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        status: "todo" | "in_progress" | "done";
        userId: string;
    }>;
    update(user: User, id: string, dto: UpdateTaskDto): Promise<{
        id: string;
        title: string;
        description: string | null;
        status: "todo" | "in_progress" | "done";
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(user: User, id: string): Promise<{
        message: string;
    }>;
}

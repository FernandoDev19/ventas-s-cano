import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private expenseModel: Model<Expense>) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const newExpense = new this.expenseModel(createExpenseDto);
    return newExpense.save();
  }

  async findAll(): Promise<Expense[]> {
    return this.expenseModel.find().sort({ date: -1 }).exec();
  }

  async findOne(id: string): Promise<Expense | null> {
    return this.expenseModel.findById(id).exec();
  }

  async update(id: string, updateExpenseDto: Partial<CreateExpenseDto>): Promise<Expense | null> {
    return this.expenseModel.findByIdAndUpdate(id, updateExpenseDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Expense | null> {
    return this.expenseModel.findByIdAndDelete(id).exec();
  }

  async findToday(): Promise<Expense[]> {
    const now = new Date();
    // Obtener fecha actual en UTC al inicio del día
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    // Mañana en UTC
    const tomorrow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    
    return this.expenseModel.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ date: -1 }).exec();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    // Las fechas ya vienen formateadas del controller
    return this.expenseModel.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 }).exec();
  }

  async getTotalExpenses(): Promise<number> {
    const result = await this.expenseModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    return result[0]?.total || 0;
  }

  async getTotalByCategory(): Promise<{ category: string; total: number }[]> {
    return this.expenseModel.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          _id: 0
        }
      }
    ]);
  }
}

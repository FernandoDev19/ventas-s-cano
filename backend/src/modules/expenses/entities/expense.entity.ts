import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ExpenseCategory } from "../dto/create-expense.dto";

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: String, required: true })
  description: string;

  @Prop({ 
    type: String, 
    required: true,
    enum: Object.values(ExpenseCategory)
  })
  category: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: false })
  notes?: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

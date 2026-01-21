import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsDate, IsOptional, IsEnum, Min, IsNotEmpty } from 'class-validator';

export enum ExpenseCategory {
  POLLO = 'pollo',
  COMBOS = 'combos',
  ACOMPANANTES = 'acompanantes',
  SALSAS = 'salsas',
  CERDO = 'cerdo',
  PASTELES = 'pasteles',
  BEBIDAS = 'bebidas',
  ADICIONALES = 'adicionales',
  INSUMOS = 'insumos',
  DELIVERY = 'delivery',
  OTROS = 'otros'
}

export class CreateExpenseDto {
  @IsString()
  @Transform(({value}) => value.trim())
  @IsNotEmpty()
  description: string;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDate()
  @Transform(({value}) => new Date(value))
  date: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}

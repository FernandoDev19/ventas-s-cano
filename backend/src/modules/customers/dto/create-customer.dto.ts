import { Transform } from 'class-transformer';
import { 
  IsString, 
  IsEmail, 
  IsPhoneNumber, 
  IsOptional, 
  MinLength, 
  MaxLength,
  IsNotEmpty 
} from 'class-validator';

export class CreateCustomerDto {
  @IsString({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsPhoneNumber('CO', { message: 'El número de teléfono no es válido' })
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'La dirección debe ser un texto' })
  @MaxLength(255, { message: 'La dirección no puede tener más de 255 caracteres' })
  address?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Las notas deben ser un texto' })
  @MaxLength(500, { message: 'Las notas no pueden tener más de 500 caracteres' })
  notes?: string;
}
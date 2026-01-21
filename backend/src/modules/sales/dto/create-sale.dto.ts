import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class ProductQuantityDto {
    @IsString()
    @IsNotEmpty()
    product: string;

    @IsNumber()
    @Min(1, { message: 'La cantidad debe ser mayor a 0' })
    quantity: number;
}

export class CreateSaleDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductQuantityDto)
    products: ProductQuantityDto[];

    @IsString()
    @Transform(({value}) => value.trim())
    @IsNotEmpty()
    customer: string;

    @IsNumber()
    @Min(0, { message: 'El total no puede ser negativo' })
    total: number;

    @IsBoolean()
    isDebt: boolean;

    @IsNumber()
    @Min(0, { message: 'El monto de la deuda no puede ser negativo' })
    @IsOptional()
    debtAmount?: number;

    @IsOptional()
    debtDate?: Date;
}
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @Transform(({ value }) => value.trim())
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    username: string;

    @IsString()
    @Transform(({ value }) => value.trim())
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsEmail()
    @Transform(({ value }) => value.trim())
    @IsNotEmpty()
    email: string;
}

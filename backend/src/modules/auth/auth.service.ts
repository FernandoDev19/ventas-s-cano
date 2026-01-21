import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { comparePassword } from 'src/utils/bcrypt.util';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

    async singIn(data: Omit<CreateUserDto, 'username'>): Promise<{ access_token: string }> {
        const user = await this.usersService.findOneByEmailWithPassword(data.email);

        if (!user) throw new UnauthorizedException('Invalid credentials');

        if (!comparePassword(data.password, user.password)) throw new UnauthorizedException('Invalid credentials');

        const payload = {
            sub: user._id,
            username: user.username,
        }

        const token = await this.jwtService.signAsync(payload);

        return { access_token: token }
    }
}

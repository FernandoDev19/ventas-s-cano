import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { hashPassword } from 'src/utils/bcrypt.util';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>){}

  async create(createUserDto: CreateUserDto) {
    const passwordHash = await hashPassword(createUserDto.password);
    createUserDto.password = passwordHash;
    
    const createdUser = await new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll() {
    const users = await this.userModel.find().select('-password').exec();
    return users;
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneByEmailWithPassword(email: string) {
    const user = await this.userModel.findOne({ email }).select('+password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const userUpdated = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).select('-password').exec();

    if (!userUpdated) throw new NotFoundException('User not found');

    return userUpdated;
  }

  async remove(id: string) {
    const userDeleted = await this.userModel.findByIdAndDelete(id).exec();

    if (!userDeleted) throw new NotFoundException('User not found');

    return `User #${id} deleted`;
  }
}

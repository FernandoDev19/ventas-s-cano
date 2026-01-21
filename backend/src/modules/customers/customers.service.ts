import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {

  constructor(@InjectModel(Customer.name) private customerModel: Model<Customer>){}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await new this.customerModel(createCustomerDto);
    return await customer.save();
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerModel.find().exec();
  }

  async findOne(id: string) {

    const customer = await this.customerModel.findById(id).exec();

    if (!customer) throw new NotFoundException(`Customer with id: "${id}" not found`)

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customerUpdated = await this.customerModel.findByIdAndUpdate(id, updateCustomerDto, { new: true }).exec();

    if (!customerUpdated) throw new NotFoundException(`Customer with id: "${id}" not found`)

    return customerUpdated;

  }

  async remove(id: string) {
    const customerDeleted = await this.customerModel.findByIdAndDelete(id, {new: true}).exec();

    if (!customerDeleted) throw new NotFoundException(`Customer with id: "${id}" not found`)

    return customerDeleted;
  }
}

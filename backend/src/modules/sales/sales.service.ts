import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<Sale>,
    private customerService: CustomersService,
    private productService: ProductsService
  ) {}

  async create(createSaleDto: CreateSaleDto) {
    await this.customerService.findOne(createSaleDto.customer);
    
    createSaleDto.products.forEach(async p => {
      await this.productService.findOne(p.product);
    });

    const sale = await new this.saleModel(createSaleDto);
    return await sale.save();
  }

  async findAll(): Promise<Sale[]> {
    return await this.saleModel.find().exec();
  }

  async findAllByCustomerId(customerId: string): Promise<Sale[]> {
    const customer = await this.customerService.findOne(customerId);

    return await this.saleModel.find({ customer: customer }).exec();
  }

  async findTodaySales(): Promise<Sale[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await this.saleModel.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).exec();
  }

  async findDebtSales(): Promise<Sale[]> {
    return await this.saleModel.find({ isDebt: true }).exec();
  }

  async findOne(id: string) {
    const sale = await this.saleModel.findById(id).exec();

    if (!sale) throw new NotFoundException(`Sale with id: "${id}" not found`);

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto) {
    const saleUpdated = await this.saleModel
      .findByIdAndUpdate(id, updateSaleDto, { new: true })
      .exec();

    if (!saleUpdated)
      throw new NotFoundException(`Sale with id: "${id}" not found`);

    return saleUpdated;
  }

  async remove(id: string) {
    const saleDeleted = await this.saleModel
      .findByIdAndDelete(id, { new: true })
      .exec();

    if (!saleDeleted)
      throw new NotFoundException(`Sale with id: "${id}" not found`);

    return saleDeleted;
  }
}

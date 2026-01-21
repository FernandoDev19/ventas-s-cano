import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import { Model } from 'mongoose';

@Injectable()
export class ProductsService {

  constructor(@InjectModel(Product.name) private productModel: Model<Product>){}

  async create(createProductDto: CreateProductDto): Promise<Product>  {
    const createdProduct = await this.productModel.create(createProductDto);
    return createdProduct;
  }

  async findAll(): Promise<Product[]> {
    return await this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product> {

    const product = await this.productModel.findById(id).exec();

    if(!product) throw new NotFoundException(`Product #${id} not found`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const productUpdated = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true }).exec();

    if(!productUpdated) throw new NotFoundException(`Product #${id} not found`);

    return productUpdated;
  }

  async remove(id: string): Promise<{message: string}> {
    const productDeleted = await this.productModel.findByIdAndDelete(id).exec();

    if(!productDeleted) throw new NotFoundException(`Product #${id} not found`);

    return {message: `Product #${id} deleted`};
  }

  async updateStock(id: string, quantity: number): Promise<Product | null> {
    const product = await this.findOne(id);
    
    const newStock = product.stock + quantity;
    
    if (newStock < 0) {
      throw new BadRequestException(`Insufficient stock for product: ${product.name}. Current: ${product.stock}, Required: ${Math.abs(quantity)}`);
    }
    
    return await this.productModel.findByIdAndUpdate(
      id,
      { stock: newStock },
      { new: true }
    ).exec();
  }
}

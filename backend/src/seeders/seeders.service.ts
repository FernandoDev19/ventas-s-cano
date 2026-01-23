import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Console } from 'console';
import { Model } from 'mongoose';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { hashPassword } from 'src/utils/bcrypt.util';

@Injectable()
export class SeedersService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async run() {
    if (
      this.configService
        .get<'development' | 'production'>('NODE_ENV')
        ?.toLowerCase() !== 'development'
    ) {
      await this.productSeeder();
      await this.customerSeeder();
      await this.userSeeder();
      return;
    }

    await this.userSeeder();
  }

  async productSeeder() {
    await this.productModel.deleteMany({});
    await this.productModel.insertMany([
      { name: 'Pollo Asado', price: 22000, stock: 50 },
      { name: 'Pollo Frito', price: 18000, stock: 30 },
      { name: 'Pollo a la Parrilla', price: 25000, stock: 0 },
    ]);

    console.log('Products seeded');
  }

  async customerSeeder() {
    await this.customerModel.deleteMany({});
    await this.customerModel.insertMany([
      { name: 'Juan Pérez', email: 'juan.perez@gmail.com', phone: '3001234567', notes: 'Cliente frecuente', address: 'Calle 123 #45-67', city: 'Bogotá', country: 'Colombia' },
      { name: 'María García', email: 'maria.garcia@gmail.com', phone: '3001234568', notes: 'Cliente nuevo', address: 'Calle 124 #46-68', city: 'Medellín', country: 'Colombia' },
      { name: 'Pedro López', email: 'pedro.lopez@gmail.com', phone: '3001234569', notes: 'Cliente VIP', address: 'Calle 125 #47-69', city: 'Cali', country: 'Colombia' },
    ]);

    console.log('Customers seeded');
  }

  async userSeeder() {
    await this.userModel.deleteMany({});

    await this.userModel.insertMany([
      { username: 'Admin', email: 'admin@gmail.com', password: await hashPassword('123456') },
    ]);

    console.log('Users seeded');
  }
}

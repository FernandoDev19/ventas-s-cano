import { Module } from '@nestjs/common';
import { SeedersService } from './seeders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/modules/products/entities/product.entity';
import { Customer, CustomerSchema } from 'src/modules/customers/entities/customer.entity';
import { User, UserSchema } from 'src/modules/users/entities/user.entity';

@Module({
  providers: [SeedersService],
  imports: [MongooseModule.forFeature([
    { name: Product.name, schema: ProductSchema },
    { name: Customer.name, schema: CustomerSchema },
    { name: User.name, schema: UserSchema },
  ])]
})
export class SeedersModule {}

import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleSchema } from './entities/sale.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
    ]),
    CustomersModule,
    ProductsModule,
  ]
})
export class SalesModule {}

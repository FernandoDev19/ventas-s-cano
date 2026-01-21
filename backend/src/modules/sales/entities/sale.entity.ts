import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { ProductQuantity, ProductQuantitySchema } from 'src/modules/products/entities/product-quantity.entity';

@Schema({ timestamps: { createdAt: 'createdAt' } })
export class Sale {
  @Prop({
    type: [ProductQuantitySchema],
    required: true,
    validate: {
      validator: (v: ProductQuantity[]) => v.length > 0,
      message: 'Debe tener al menos un producto',
    },
  })
  products: ProductQuantity[];

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true })
  customer: Customer;

  @Prop({ type: Boolean, required: true })
  isDebt: boolean;

  @Prop({ type: Number })
  debtAmount?: number;

  @Prop({ type: Date })
  debtDate?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

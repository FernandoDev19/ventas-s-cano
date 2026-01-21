import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Product } from "src/modules/products/entities/product.entity";

@Schema()
export class ProductQuantity {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Product;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;
}
export const ProductQuantitySchema =
  SchemaFactory.createForClass(ProductQuantity);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
@Schema()
export class Product {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: Number, required: true })
    price: number;

    @Prop({ type: Number, default: 0, min: 0 })
    stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
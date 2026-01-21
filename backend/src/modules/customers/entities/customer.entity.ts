import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Customer {
    @Prop({type: String, required: true})
    name: string;

    @Prop({type: String})
    phone?: string;

    @Prop({type: String})
    address?: string;

    @Prop({type: String})
    email?: string;

    @Prop({type: String})
    notes?: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
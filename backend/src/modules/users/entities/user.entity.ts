import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User {
    @Prop({ type: String, required: true })
    username: string;

    @Prop({ type: String, required: true, select: false })
    password: string;

    @Prop({ type: String, required: true })
    email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
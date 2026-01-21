import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Sale } from '../src/modules/sales/entities/sale.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { Customer } from '../src/modules/customers/entities/customer.entity';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Sales (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let productId: Types.ObjectId;
  let customerId: Types.ObjectId;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      }),
    );
    await app.init();

    connection = moduleFixture.get<Connection>(getConnectionToken());

    // Clear database before tests
    await connection.dropDatabase();

    // Create test product
    const productModel = moduleFixture.get(getModelToken(Product.name));
    const product = await productModel.create({
      name: 'Test Product',
      price: 100,
      stock: 10,
    });
    productId = product._id;

    // Create test customer
    const customerModel = moduleFixture.get(getModelToken(Customer.name));
    const customer = await customerModel.create({
      name: 'Test Customer',
      email: 'test@example.com',
    });
    customerId = customer._id;
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await app.close();
  });

  describe('/sales (POST)', () => {
    it('should create a sale', async () => {
      const saleData = {
        products: [
          {
            product: productId.toString(),
            quantity: 2,
          },
        ],
        customer: customerId.toString(),
        total: 200,
        isDebt: false,
      };

      const { body } = await request(app.getHttpServer())
        .post('/api/v1/sales')
        .send(saleData)
        .expect(201);

      expect(body).toHaveProperty('_id');
      expect(body.total).toBe(200);
      expect(body.products).toHaveLength(1);
      expect(body.products[0].quantity).toBe(2);
    });

    it('should return 400 if product does not exist', async () => {
      const invalidSaleData = {
        products: [
          {
            productId: new Types.ObjectId().toString(),
            quantity: 1,
          },
        ],
        total: 100,
        isDebt: false,
      };

      await request(app.getHttpServer())
        .post('/api/v1/sales')
        .send(invalidSaleData)
        .expect(400);
    });

    it('should return 400 if customer does not exist', async () => {
      const invalidSaleData = {
        products: [
          {
            productId: productId.toString(),
            quantity: 1,
          },
        ],
        customerId: new Types.ObjectId().toString(),
        total: 100,
        isDebt: false,
      };

      await request(app.getHttpServer())
        .post('/api/v1/sales')
        .send(invalidSaleData)
        .expect(400);
    });
  });

  describe('/sales (GET)', () => {
    it('should return an array of sales', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/sales')
        .expect(200);

      expect(Array.isArray(body)).toBe(true);
    });
  });
});

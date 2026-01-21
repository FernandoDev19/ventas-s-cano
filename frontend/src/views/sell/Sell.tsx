import { useState, useEffect } from 'react';
import { ChevronRight, Plus, Minus, Search, User, Package, DollarSign, CreditCard } from 'lucide-react';
import type { Customer } from '../../models/customer.model';
import type { Product } from '../../models/product.model';
import type { Sale, ProductQuantity } from '../../models/sale.model';
import customerService from '../../services/customer.service';
import saleService from '../../services/sale.service';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import productService from '../../services/product.service';

const MySwal = withReactContent(Swal);

type SaleStep = 'products' | 'customer' | 'payment' | 'summary';

export default function Sell() {
  const [currentStep, setCurrentStep] = useState<SaleStep>('products');
  const [selectedProducts, setSelectedProducts] = useState<ProductQuantity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  // const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar productos y clientes al inicio
  useEffect(() => {
    loadProducts();
    loadCustomers();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const customersData = await customerService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  // Calcular totales
  const subtotal = selectedProducts.reduce((sum, item) => {
    const product = products.find(p => p._id === item.product);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Product functions
  const addProduct = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.product === product._id);
    if (existingItem) {
      updateProductQuantity(product._id!, existingItem.quantity + 1);
    } else {
      setSelectedProducts([...selectedProducts, { product: product._id!, quantity: 1 }]);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(selectedProducts.filter(item => item.product !== productId));
    } else {
      setSelectedProducts(selectedProducts.map(item =>
        item.product === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.product !== productId));
  };

  // Customer functions
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name);
  };

  const createNewCustomer = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Crear Nuevo Cliente',
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre *</label>
            <input id="swal-name" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Ingrese el nombre completo" required>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Teléfono</label>
            <input id="swal-phone" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Ingrese el teléfono">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email</label>
            <input id="swal-email" class="swal2-input" style="margin: 0; width: 100%;" type="email" placeholder="correo@ejemplo.com">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Dirección</label>
            <input id="swal-address" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Ingrese la dirección completa">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Notas</label>
            <input id="swal-notes" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Información adicional del cliente">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear Cliente',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = (document.getElementById('swal-name') as HTMLInputElement).value.trim() || null;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value.trim() || null;
        const email = (document.getElementById('swal-email') as HTMLInputElement).value.trim() || null;
        const address = (document.getElementById('swal-address') as HTMLInputElement).value.trim() || null;
        const notes = (document.getElementById('swal-notes') as HTMLInputElement).value.trim() || null;

        if (!name) {
          MySwal.showValidationMessage('El nombre es obligatorio');
          return false;
        }

        return { name, phone, email, address, notes };
      }
    });

    if (formValues) {
      try {
        const newCustomer = await customerService.createCustomer(formValues);
        setCustomers([...customers, newCustomer]);
        setSelectedCustomer(newCustomer);
        setSearchTerm(newCustomer.name);
        await MySwal.fire('Éxito', 'Cliente creado correctamente', 'success');
      } catch (error) {
        console.error('Error creating customer:', error);
        await MySwal.fire('Error', 'No se pudo crear el cliente', 'error');
      }
    }
  };

  // Navigation
  const nextStep = () => {
    if (currentStep === 'products' && selectedProducts.length === 0) {
      MySwal.fire('Información', 'Debes agregar al menos un producto', 'warning');
      return;
    }
    if (currentStep === 'customer' && !selectedCustomer) {
      MySwal.fire('Información', 'Debes seleccionar un cliente', 'warning');
      return;
    }
    setCurrentStep(getNextStep(currentStep));
  };

  const prevStep = () => {
    setCurrentStep(getPrevStep(currentStep));
  };

  const getNextStep = (step: SaleStep): SaleStep => {
    switch (step) {
      case 'products': return 'customer';
      case 'customer': return 'payment';
      case 'payment': return 'summary';
      default: return 'products';
    }
  };

  const getPrevStep = (step: SaleStep): SaleStep => {
    switch (step) {
      case 'customer': return 'products';
      case 'payment': return 'customer';
      case 'summary': return 'payment';
      default: return 'products';
    }
  };

  // Final sale
  const completeSale = async () => {
    setIsLoading(true);
    try {
      const saleData: Omit<Sale, '_id' | 'createdAt'> = {
        products: selectedProducts,
        customer: selectedCustomer?._id || '',
        total: subtotal,
        isDebt: isDebt,
        debtAmount: isDebt ? subtotal : undefined,
        debtDate: isDebt ? new Date().toISOString() : undefined
      };

      await saleService.createSale(saleData);
      
      await MySwal.fire({
        title: '¡Venta Registrada!',
        text: `Venta por $${subtotal.toLocaleString()} COP registrada exitosamente`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Reset form
      setSelectedProducts([]);
      setSelectedCustomer(null);
      setIsDebt(false);
      setCurrentStep('products');
    } catch (error) {
      console.error('Error creating sale:', error);
      MySwal.fire('Error', 'No se pudo registrar la venta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl md:max-w-4xl mx-auto p-2 md:p-4 space-y-6">

      <h2 className="text-4xl font-bold text-primary mb-6">Realizar Venta</h2>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {['products', 'customer', 'payment', 'summary'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step
                    ? 'bg-primary text-white'
                    : index < ['products', 'customer', 'payment', 'summary'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Products */}
      {currentStep === 'products' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Package className="mr-2" />
            Seleccionar Productos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {products.map((product) => (
              <div key={product._id} title={ product.stock > 0 ? 'Disponible' : 'Agotado' } className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-2xl font-bold text-primary">
                  ${product.price.toLocaleString()} COP
                </p>
                <p className="text-sm text-gray-600">Stock: {product.stock}</p>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateProductQuantity(product._id!, 
                        selectedProducts.find(item => item.product === product._id)!.quantity - 1 || 0
                      )}
                      className="p-2 rounded hover:bg-gray-100"
                      disabled={product.stock === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-lg w-8 text-center">
                      {selectedProducts.find(item => item.product === product._id)?.quantity || 0}
                    </span>
                    <button
                      onClick={() => addProduct(product)}
                      className="p-2 rounded hover:bg-gray-100"
                      disabled={product.stock === 0 || selectedProducts.find(item => item.product === product._id)?.quantity === product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Products Summary */}
          {selectedProducts.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Productos Seleccionados</h3>
              <div className="space-y-2">
                {selectedProducts.map((item) => {
                  const product = products.find(p => p._id === item.product);
                  return (
                    <div key={item.product.toString()} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{product?.name} x {item.quantity}</span>
                      <span className="font-semibold">
                        ${((product?.price || 0) * item.quantity).toLocaleString()} COP
                      </span>
                      <button
                        onClick={() => removeProduct(item.product.toString())}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="border-t mt-2 pt-2 text-right">
                <span className="text-xl font-bold">Subtotal: ${subtotal.toLocaleString()} COP</span>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={nextStep}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
            >
              Seleccionar Cliente {'->'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Customer */}
      {currentStep === 'customer' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="mr-2" />
            Seleccionar Cliente
          </h2>

          {/* Customer Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 max-h-60 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => selectCustomer(customer)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedCustomer?._id === customer._id
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                }`}
              >
                <h4 className="font-semibold">{customer.name}</h4>
                {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                {customer.address && <p className="text-sm text-gray-600">{customer.address}</p>}
              </div>
            ))}
          </div>

          {/* Create New Customer */}
          <div className="mb-6">
            <button
              onClick={createNewCustomer}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary"
            >
              + Crear Nuevo Cliente
            </button>
          </div>

          {/* Selected Customer */}
          {selectedCustomer && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Cliente Seleccionado</h3>
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold">{selectedCustomer.name}</h4>
                {selectedCustomer.phone && <p className="text-sm">{selectedCustomer.phone}</p>}
                {selectedCustomer.address && <p className="text-sm">{selectedCustomer.address}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-1 mt-6">
            <button
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={nextStep}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 text-sm md:text-base"
            >
              Método de Pago {'->'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 'payment' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <DollarSign className="mr-2" />
            Método de Pago
          </h2>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg">Subtotal:</span>
                <span className="text-xl font-bold">${subtotal.toLocaleString()} COP</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={!isDebt}
                  onChange={() => setIsDebt(false)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold">Contado</div>
                  <div className="text-sm text-gray-600">Pago inmediato</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={isDebt}
                  onChange={() => setIsDebt(true)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-semibold">Fiado</div>
                  <div className="text-sm text-gray-600">Puede pagar después</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={nextStep}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 text-sm md:text-base"
            >
              Resumen {'->'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {currentStep === 'summary' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Resumen de Venta</h2>

          {/* Products Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Productos</h3>
            <div className="space-y-2">
              {selectedProducts.map((item) => {
                const product = products.find(p => p._id === item.product);
                return (
                  <div key={item.product.toString()} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{product?.name} x {item.quantity}</span>
                    <span className="font-semibold">
                      ${((product?.price || 0) * item.quantity).toLocaleString()} COP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Cliente</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold">{selectedCustomer?.name}</h4>
              {selectedCustomer?.phone && <p className="text-sm">{selectedCustomer.phone}</p>}
              {selectedCustomer?.email && <p className="text-sm">{selectedCustomer.email}</p>}
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Método de Pago</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ${subtotal.toLocaleString()} COP
                </span>
              </div>
              <div className="mt-2 text-lg">
                {isDebt ? (
                  <span className="text-orange-600">FIADO - Pagar después</span>
                ) : (
                  <span className="text-green-600">CONTADO - Pago inmediato</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6 gap-2">
            <button
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={completeSale}
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 text-sm md:text-base"></div>
                  Procesando...
                </div>
              ) : (
                <div className="flex items-center text-sm md:text-base">
                  Completar Venta
                  <CreditCard className="mr-2" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

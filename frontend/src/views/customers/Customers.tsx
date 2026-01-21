import { useEffect, useState } from "react";
import customerService from "../../services/customer.service";
import type { Customer } from "../../models";
import type { Sale } from "../../models/sale.model";
import type { Product } from "../../models/product.model";
import { Search } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import productService from "../../services/product.service";

const MySwal = withReactContent(Swal);

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadCustomers();
    loadProducts();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleClickCustomer = async (customerId: string) => {
    try {
      const sales: Sale[] = await customerService.getSalesByCustomerId(customerId);
      const customer = customers.find(c => c._id === customerId);
      
      if (!customer) return;

      await MySwal.fire({
        title: (
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">Ventas de {customer.name}</h3>
            <div className="text-sm text-gray-600 mb-4">
              {customer.phone && <p><strong>Teléfono:</strong> {customer.phone}</p>}
              {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
              {customer.address && <p><strong>Dirección:</strong> {customer.address}</p>}
            </div>
          </div>
        ),
        html: (
          <div className="max-h-96 overflow-y-auto">
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Este cliente no tiene ventas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div key={sale._id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{new Date(sale.createdAt?.toString() || '').toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">
                          {sale.products.length} producto{sale.products.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm">
                          {sale.products.map((item, index) => {
                            const product = products.find(p => p._id === item.product);
                            const productName = product?.name || 'Producto desconocido';
                            return (
                              <span key={index}>
                                {productName} x{item.quantity}
                                {index < sale.products.length - 1 && ', '}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${sale.total.toLocaleString()} COP
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          sale.isDebt 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sale.isDebt ? 'Fiado' : 'Contado'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
        width: '600px',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar',
        showCancelButton: false,
        customClass: {
          popup: 'rounded-lg shadow-xl'
        }
      });
    } catch (error) {
      console.error("Error loading customer sales:", error);
      setError("No se pudieron cargar las ventas del cliente");
    }
  };

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const customersData = await customerService.getCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading customers:", error);
      setError("No se pudieron cargar los clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
        <button
          onClick={loadCustomers}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-primary">Clientes</h1>

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

      {customers.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 text-lg">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          { filteredCustomers.map((customer) => (
            <div
              key={customer._id}
              onClick={() => handleClickCustomer(customer._id!)}
              className="p-4 border rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:bg-primary/10 transform hover:scale-105 cursor-pointer"
            >
              <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>

              {customer.phone && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Teléfono:</strong> {customer.phone}
                </p>
              )}

              {customer.email && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Email:</strong> {customer.email}
                </p>
              )}

              {customer.address && (
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Dirección:</strong> {customer.address}
                </p>
              )}

              {customer.notes && (
                <p className="text-sm text-gray-600">
                  <strong>Notas:</strong> {customer.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

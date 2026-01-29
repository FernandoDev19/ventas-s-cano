import { useEffect, useState } from "react";
import type { Customer, Product, Sale } from "../../models";
import customerService from "../../services/customer.service";
import CustomerCard from "./ui/CustomerCard";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import productService from "../../services/product.service";

type Props = {
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  searchTerm: string;
  error: string | null;
};

const MySwal = withReactContent(Swal);

export default function CustomersList({
  setIsLoading,
  setError,
  searchTerm,
  error
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

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

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const handleClickCustomer = async (customerId: string) => {
    try {
      setIsLoading(true);
      const sales: Sale[] = await customerService.getSalesByCustomerId(customerId);

      const salesLast30Days = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt || '');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return saleDate >= thirtyDaysAgo;
      });
      
      const customer = customers.find((c) => c._id === customerId);

      if (!customer) return;

      setIsLoading(false);

      await MySwal.fire({
        title: (
          <div className="text-left">
            <h3 className="text-xl font-bold mb-4">
              Compras de {customer.name} (Últimos 30 Días)
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              {customer.phone && (
                <p>
                  <strong>Teléfono:</strong> {customer.phone}
                </p>
              )}
              {customer.email && (
                <p>
                  <strong>Email:</strong> {customer.email}
                </p>
              )}
              {customer.address && (
                <p>
                  <strong>Dirección:</strong> {customer.address}
                </p>
              )}
            </div>
          </div>
        ),
        html: (
          <div className="max-h-96 overflow-y-auto">
            {salesLast30Days.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Este cliente no tiene compras registradas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {salesLast30Days.map((sale) => (
                  <div key={sale._id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-left">
                        <div className="font-semibold">
                          {new Date(
                            sale.createdAt?.toString() || "",
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {sale.products.length} producto
                          {sale.products.length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-sm">
                          {sale.products.map((item, index) => {
                            const product = products.find(
                              (p) => p._id === item.product,
                            );
                            const productName =
                              product?.name || "Producto desconocido";
                            return (
                              <span key={index}>
                                {productName} x{item.quantity}
                                {index < sale.products.length - 1 && ", "}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ${sale.total.toLocaleString()} COP
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            sale.isDebt
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {sale.isDebt ? "Fiado" : "Contado"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
        width: "600px",
        showConfirmButton: true,
        confirmButtonText: "Cerrar",
        showCancelButton: false,
        customClass: {
          popup: "rounded-lg shadow-xl",
        },
      });
    } catch (error) {
      console.error("Error loading customer sales:", error);
      setError("No se pudieron cargar las ventas del cliente");
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <>
      {customers.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 text-lg">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              handleClickCustomer={handleClickCustomer}
            />
          ))}
        </div>
      )}
    </>
  );
}

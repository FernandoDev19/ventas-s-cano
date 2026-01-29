import type { Customer } from "../../../models";

type Props = {
  customer: Customer;
  handleClickCustomer: (customerId: string) => void;
};

export default function CustomerCard({ customer, handleClickCustomer }: Props) {
  return (
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
  );
}

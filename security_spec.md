# Security Specification: Hemma Boutique

## Data Invariants
1. A Product must have a name, price > 0, and belong to a valid category.
2. An Order must have a subtotal + deliveryCost = total.
3. Only authenticated admins can create, update, or delete Products.
4. Anyone can view Products.
5. Anyone can create an Order, but only the specific user (if they were logged in) or an Admin can view it. (In this app, orders might be guest-only, but let's secure them).
6. Admins can view all Orders.

## The "Dirty Dozen" Payloads
1. **The Price Manipulation**: Creating an order with a total lower than the sum of items + delivery.
2. **The Unauthorized Product Edit**: A guest user trying to change a product's price.
3. **The Ghost Order**: Creating an order with no items.
4. **The Admin Escalation**: A user trying to add their own UID to the `/admins` collection.
5. **The Negative Stock**: Setting product stock to -1.
6. **The PII Leak**: A user trying to list all orders including other customers' addresses.
7. **The Delivery Cost Hack**: Setting delivery cost to 0 for a zone that costs $5.
8. **The Immutable Field Edit**: Trying to change `createdAt` on an existing order.
9. **The Huge ID**: Injecting a 2MB string as a product ID.
10. **The Shadow Field**: Adding `isVerified: true` to a product to bypass some potential client-side logic.
11. **The Deleted Product Recovery**: Trying to un-delete a product by re-creating it with old data if there's some soft-delete.
12. **The Status Jump**: Changing an order status from 'pending' directly to 'delivered' without being an admin.

## Test Runner Logic
The `firestore.rules` will be validated to block these payloads.

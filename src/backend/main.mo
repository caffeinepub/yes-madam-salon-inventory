import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";

actor {
  type Category = {
    id : Nat;
    name : Text;
  };

  type Product = {
    id : Nat;
    name : Text;
    categoryId : Nat;
    openingStock : Nat;
    currentStock : Nat;
    unit : Text;
    lowStockThreshold : Nat;
    brand : Text;
  };

  var nextCategoryId = 20;
  var nextProductId = 1;

  let categories = Map.empty<Nat, Category>();

  let products = Map.empty<Nat, Product>();

  // Pre-seed categories
  let initialCategories = [
    (1, "Hair Color"),
    (2, "Shampoo"),
    (3, "Conditioner"),
    (4, "Treatment"),
    (5, "Styling"),
    (6, "Nail Care"),
    (7, "Skin Care"),
    (8, "Waxing"),
    (9, "Threading"),
    (10, "Bleach"),
    (11, "Toner"),
    (12, "Oil"),
    (13, "Serum"),
    (14, "Mask"),
    (15, "Gloves"),
    (16, "Foils"),
    (17, "Developer"),
    (18, "Perm"),
    (19, "Relaxer"),
  ];

  for ((id, name) in initialCategories.values()) {
    categories.add(id, { id; name });
  };

  public shared ({ caller }) func addCategory(name : Text) : async Category {
    if (name.size() == 0) { Runtime.trap("Category name cannot be empty") };

    let newCategory : Category = {
      id = nextCategoryId;
      name;
    };

    categories.add(nextCategoryId, newCategory);
    nextCategoryId += 1;
    newCategory;
  };

  public query ({ caller }) func getCategories() : async [Category] {
    categories.values().toArray();
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async Bool {
    if (id <= 19) { Runtime.trap("Cannot delete default categories") };

    let categoryExists = categories.containsKey(id);
    categories.remove(id);
    categoryExists;
  };

  public shared ({ caller }) func addProduct(
    name : Text,
    categoryId : Nat,
    openingStock : Nat,
    unit : Text,
    lowStockThreshold : Nat,
  ) : async Product {

    if (categories.get(categoryId) == null) {
      Runtime.trap("Category does not exist");
    };

    let newProduct : Product = {
      id = nextProductId;
      name;
      categoryId;
      openingStock;
      currentStock = openingStock;
      unit;
      lowStockThreshold;
      brand = "Yes Madam";
    };

    products.add(nextProductId, newProduct);
    nextProductId += 1;
    newProduct;
  };

  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getProductById(id : Nat) : async ?Product {
    products.get(id);
  };
};

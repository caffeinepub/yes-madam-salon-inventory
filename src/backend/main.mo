import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";

import Iter "mo:core/Iter";

// Ensure migration is run during upgrade

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

  type Staff = {
    id : Nat;
    name : Text;
    role : Text;
  };

  type UsageRecord = {
    id : Nat;
    date : Text;
    productId : Nat;
    categoryId : Nat;
    staffId : Nat;
    quantity : Nat;
    time : Text;
    clientName : Text;
  };

  var nextCategoryId = 8; // Start after 7 pre-seeded categories
  var nextProductId = 1;
  var nextStaffId = 1;
  var nextUsageId = 1;

  let categories = Map.empty<Nat, Category>();
  let products = Map.empty<Nat, Product>();
  let staffMembers = Map.empty<Nat, Staff>();
  let usageRecords = Map.empty<Nat, UsageRecord>();

  // Pre-seed categories (only if not already present)
  let initialCategories = [
    (1, "Bleach"),
    (2, "Meni Pedi"),
    (3, "Cleanup"),
    (4, "Facial"),
    (5, "Wax"),
    (6, "Oil"),
    (7, "Hair Spa"),
  ];

  let allCategoriesPresent = initialCategories.foldLeft(
    true,
    func(acc, (id, _)) {
      acc and categories.containsKey(id);
    },
  );

  if (not allCategoriesPresent) {
    for ((id, name) in initialCategories.values()) {
      categories.add(id, { id; name });
    };
  };

  // Category APIs
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
    if (id <= 7) { Runtime.trap("Cannot delete default categories") };

    let categoryExists = categories.containsKey(id);
    categories.remove(id);
    categoryExists;
  };

  // Product APIs
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

  public shared ({ caller }) func updateProduct(
    id : Nat,
    name : Text,
    categoryId : Nat,
    currentStock : Nat,
    unit : Text,
    lowStockThreshold : Nat,
  ) : async ?Product {
    switch (products.get(id)) {
      case (null) { null };
      case (?product) {
        let updatedProduct : Product = {
          id = product.id;
          name;
          categoryId;
          openingStock = product.openingStock;
          currentStock;
          unit;
          lowStockThreshold;
          brand = "Yes Madam"; // keep brand
        };
        products.add(id, updatedProduct);
        ?updatedProduct;
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async Bool {
    let productExists = products.containsKey(id);
    products.remove(id);
    productExists;
  };

  // Staff APIs
  public shared ({ caller }) func addStaff(name : Text, role : Text) : async Staff {
    let newStaff : Staff = {
      id = nextStaffId;
      name;
      role;
    };

    staffMembers.add(nextStaffId, newStaff);
    nextStaffId += 1;
    newStaff;
  };

  public query ({ caller }) func getStaff() : async [Staff] {
    staffMembers.values().toArray();
  };

  public shared ({ caller }) func updateStaff(id : Nat, name : Text, role : Text) : async ?Staff {
    switch (staffMembers.get(id)) {
      case (null) { null };
      case (?staff) {
        let updatedStaff : Staff = {
          id = staff.id;
          name;
          role;
        };
        staffMembers.add(id, updatedStaff);
        ?updatedStaff;
      };
    };
  };

  public shared ({ caller }) func deleteStaff(id : Nat) : async Bool {
    let staffExists = staffMembers.containsKey(id);
    staffMembers.remove(id);
    staffExists;
  };

  // UsageRecord APIs
  public shared ({ caller }) func addUsageRecord(
    date : Text,
    productId : Nat,
    categoryId : Nat,
    staffId : Nat,
    quantity : Nat,
    time : Text,
    clientName : Text,
  ) : async UsageRecord {
    if (products.get(productId) == null) {
      Runtime.trap("Product does not exist");
    };
    if (categories.get(categoryId) == null) {
      Runtime.trap("Category does not exist");
    };
    if (staffMembers.get(staffId) == null) {
      Runtime.trap("Staff member does not exist");
    };

    let newUsage : UsageRecord = {
      id = nextUsageId;
      date;
      productId;
      categoryId;
      staffId;
      quantity;
      time;
      clientName;
    };

    usageRecords.add(nextUsageId, newUsage);
    nextUsageId += 1;
    newUsage;
  };

  public query ({ caller }) func getUsageRecords() : async [UsageRecord] {
    usageRecords.values().toArray();
  };

  public query ({ caller }) func getUsageStats() : async {
    totalUsageToday : Nat;
    totalUsageAllTime : Nat;
  } {
    let totalUsageAllTime = usageRecords.size();
    // Not computing totalUsageToday as backend does not track current date
    { totalUsageToday = 0; totalUsageAllTime };
  };
};

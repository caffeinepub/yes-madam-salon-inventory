import Array "mo:core/Array";
import Nat "mo:core/Nat";
import VarArray "mo:core/VarArray";
import Iter "mo:core/Iter";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Types

  type Category = {
    id : Nat;
    name : Text;
  };

  type Product = {
    id : Nat;
    name : Text;
    brand : Text;
    categoryId : Nat;
    openingStock : Nat;
    currentStock : Nat;
    unit : Text;
    lowStockThreshold : Nat;
    rackNumber : Text;
  };

  type Staff = {
    id : Nat;
    name : Text;
    role : Text;
    mobile : Text;
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

  type EquipmentItem = {
    id : Nat;
    name : Text;
  };

  type EquipmentCheckout = {
    id : Nat;
    staffId : Nat;
    equipmentId : Nat;
    date : Text;
    takenAt : Text;
    returnedAt : Text;
  };

  type AttendanceEntry = {
    id : Nat;
    date : Text;
    staffId : Nat;
    status : Text;
  };

  type CashEntry = {
    id : Nat;
    date : Text;
    entryType : Text;
    amount : Nat;
    description : Text;
    recipientStaffId : Nat;
    notes : Text;
  };

  type HomeServiceSettlement = {
    id : Nat;
    date : Text;
    staffId : Nat;
    clientName : Text;
    serviceAmount : Nat;
    clientPaid : Nat;
    travelExpense : Nat;
    notes : Text;
  };

  // Stable storage

  stable var categories : [Category] = [];
  stable var products : [Product] = [];
  stable var staff : [Staff] = [];
  stable var usageRecords : [UsageRecord] = [];
  stable var equipmentItems : [EquipmentItem] = [];
  stable var equipmentCheckouts : [EquipmentCheckout] = [];
  stable var attendanceEntries : [AttendanceEntry] = [];
  stable var cashEntries : [CashEntry] = [];
  stable var homeServiceSettlements : [HomeServiceSettlement] = [];

  stable var nextCategoryId : Nat = 1;
  stable var nextProductId : Nat = 1;
  stable var nextStaffId : Nat = 1;
  stable var nextUsageId : Nat = 1;
  stable var nextEquipmentItemId : Nat = 1;
  stable var nextEquipmentCheckoutId : Nat = 1;
  stable var nextAttendanceId : Nat = 1;
  stable var nextCashEntryId : Nat = 1;
  stable var nextHomeServiceSettlementId : Nat = 1;

  // Category APIs

  public query ({ caller }) func getCategories() : async [Category] {
    categories;
  };

  public shared ({ caller }) func addCategory(name : Text) : async Category {
    let category : Category = {
      id = nextCategoryId;
      name;
    };

    let newCategories = categories.concat([category]);
    categories := newCategories;
    nextCategoryId += 1;

    category;
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    let newCategories = categories.filter(func(c) { c.id != id });
    categories := newCategories;
  };

  // Product APIs

  public query ({ caller }) func getProducts() : async [Product] {
    products;
  };

  public shared ({ caller }) func addProduct(
    name : Text,
    categoryId : Nat,
    openingStock : Nat,
    unit : Text,
    lowStockThreshold : Nat,
    rackNumber : Text,
  ) : async Product {
    let product : Product = {
      id = nextProductId;
      name;
      brand = "Yes Madam";
      categoryId;
      openingStock;
      currentStock = openingStock;
      unit;
      lowStockThreshold;
      rackNumber;
    };

    let newProducts = products.concat([product]);
    products := newProducts;
    nextProductId += 1;

    product;
  };

  public shared ({ caller }) func updateProduct(
    id : Nat,
    name : Text,
    categoryId : Nat,
    currentStock : Nat,
    unit : Text,
    lowStockThreshold : Nat,
    rackNumber : Text,
  ) : async () {
    let newProducts = products.map(
      func(p) {
        if (p.id == id) {
          {
            id;
            name;
            brand = p.brand;
            categoryId;
            openingStock = p.openingStock;
            currentStock;
            unit;
            lowStockThreshold;
            rackNumber;
          };
        } else {
          p;
        };
      }
    );
    products := newProducts;
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    let newProducts = products.filter(func(p) { p.id != id });
    products := newProducts;
  };

  // Staff APIs

  public query ({ caller }) func getStaff() : async [Staff] {
    staff;
  };

  public shared ({ caller }) func addStaff(name : Text, role : Text, mobile : Text) : async Staff {
    let newStaffs = staff.concat([
      {
        id = nextStaffId;
        name;
        role;
        mobile;
      },
    ]);
    staff := newStaffs;
    nextStaffId += 1;

    {
      id = nextStaffId - 1;
      name;
      role;
      mobile;
    };
  };

  public shared ({ caller }) func updateStaff(id : Nat, name : Text, role : Text, mobile : Text) : async () {
    let newStaffs = staff.map(
      func(s) {
        if (s.id == id) {
          {
            id;
            name;
            role;
            mobile;
          };
        } else {
          s;
        };
      }
    );
    staff := newStaffs;
  };

  public shared ({ caller }) func deleteStaff(id : Nat) : async () {
    let newStaffs = staff.filter(func(s) { s.id != id });
    staff := newStaffs;
  };

  // UsageRecord APIs

  public query ({ caller }) func getUsageRecords() : async [UsageRecord] {
    usageRecords;
  };

  public shared ({ caller }) func addUsageRecord(
    date : Text,
    productId : Nat,
    categoryId : Nat,
    staffId : Nat,
    quantity : Nat,
    time : Text,
    clientName : Text,
  ) : async () {
    let usageRecord : UsageRecord = {
      id = nextUsageId;
      date;
      productId;
      categoryId;
      staffId;
      quantity;
      time;
      clientName;
    };

    let newUsageRecords = usageRecords.concat([usageRecord]);
    usageRecords := newUsageRecords;
    nextUsageId += 1;
  };

  public shared ({ caller }) func deleteUsageRecord(id : Nat) : async () {
    let newUsageRecords = usageRecords.filter(func(u) { u.id != id });
    usageRecords := newUsageRecords;
  };

  // Equipment APIs

  public query ({ caller }) func getEquipmentItems() : async [EquipmentItem] {
    equipmentItems;
  };

  public shared ({ caller }) func addEquipmentItem(name : Text) : async EquipmentItem {
    let equipmentItem : EquipmentItem = {
      id = nextEquipmentItemId;
      name;
    };

    let newEquipmentItems = equipmentItems.concat([equipmentItem]);
    equipmentItems := newEquipmentItems;
    nextEquipmentItemId += 1;

    equipmentItem;
  };

  public shared ({ caller }) func deleteEquipmentItem(id : Nat) : async () {
    let newEquipmentItems = equipmentItems.filter(func(e) { e.id != id });
    equipmentItems := newEquipmentItems;
  };

  public query ({ caller }) func getEquipmentCheckouts() : async [EquipmentCheckout] {
    equipmentCheckouts;
  };

  public shared ({ caller }) func addEquipmentCheckout(staffId : Nat, equipmentId : Nat, date : Text, takenAt : Text) : async () {
    let checkout : EquipmentCheckout = {
      id = nextEquipmentCheckoutId;
      staffId;
      equipmentId;
      date;
      takenAt;
      returnedAt = "";
    };

    let newCheckouts = equipmentCheckouts.concat([checkout]);
    equipmentCheckouts := newCheckouts;
    nextEquipmentCheckoutId += 1;
  };

  public shared ({ caller }) func returnEquipmentCheckout(id : Nat, returnedAt : Text) : async () {
    let newCheckouts = equipmentCheckouts.map(
      func(e) {
        if (e.id == id) {
          {
            id = e.id;
            staffId = e.staffId;
            equipmentId = e.equipmentId;
            date = e.date;
            takenAt = e.takenAt;
            returnedAt;
          };
        } else {
          e;
        };
      }
    );
    equipmentCheckouts := newCheckouts;
  };

  // Attendance APIs

  public query ({ caller }) func getAttendanceEntries() : async [AttendanceEntry] {
    attendanceEntries;
  };

  public shared ({ caller }) func setAttendance(date : Text, staffId : Nat, status : Text) : async () {
    let attendance : AttendanceEntry = {
      id = nextAttendanceId;
      date;
      staffId;
      status;
    };

    let newEntries = attendanceEntries.concat([attendance]);
    attendanceEntries := newEntries;
    nextAttendanceId += 1;
  };

  public shared ({ caller }) func clearAttendance(date : Text, staffId : Nat) : async () {
    let newEntries = attendanceEntries.filter(
      func(a) {
        a.date != date or a.staffId != staffId;
      }
    );
    attendanceEntries := newEntries;
  };

  public shared ({ caller }) func markAllPresent(date : Text, staffIds : [Nat]) : async () {
    for (staffId in staffIds.values()) {
      await setAttendance(date, staffId, "present");
    };
  };

  // Cash Entries APIs

  public query ({ caller }) func getCashEntries() : async [CashEntry] {
    cashEntries;
  };

  public shared ({ caller }) func addCashEntry(
    date : Text,
    entryType : Text,
    amount : Nat,
    description : Text,
    recipientStaffId : Nat,
    notes : Text,
  ) : async () {
    let cashEntry : CashEntry = {
      id = nextCashEntryId;
      date;
      entryType;
      amount;
      description;
      recipientStaffId;
      notes;
    };

    let newCashEntries = cashEntries.concat([cashEntry]);
    cashEntries := newCashEntries;
    nextCashEntryId += 1;
  };

  public shared ({ caller }) func deleteCashEntry(id : Nat) : async () {
    let newCashEntries = cashEntries.filter(func(c) { c.id != id });
    cashEntries := newCashEntries;
  };

  // Home Service Settlements APIs

  public query ({ caller }) func getHomeServiceSettlements() : async [HomeServiceSettlement] {
    homeServiceSettlements;
  };

  public shared ({ caller }) func addHomeServiceSettlement(
    date : Text,
    staffId : Nat,
    clientName : Text,
    serviceAmount : Nat,
    clientPaid : Nat,
    travelExpense : Nat,
    notes : Text,
  ) : async () {
    let settlement : HomeServiceSettlement = {
      id = nextHomeServiceSettlementId;
      date;
      staffId;
      clientName;
      serviceAmount;
      clientPaid;
      travelExpense;
      notes;
    };

    let newSettlements = homeServiceSettlements.concat([settlement]);
    homeServiceSettlements := newSettlements;
    nextHomeServiceSettlementId += 1;
  };

  public shared ({ caller }) func deleteHomeServiceSettlement(id : Nat) : async () {
    let newSettlements = homeServiceSettlements.filter(func(h) { h.id != id });
    homeServiceSettlements := newSettlements;
  };
};

import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Migration "migration";
import Nat "mo:core/Nat";

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
    openingDate : Text;
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
    pinned : Bool;
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

  type PackItem = {
    id : Nat;
    name : Text;
    unit : Text;
  };

  type PackArrival = {
    id : Nat;
    packItemId : Nat;
    date : Text;
    quantity : Nat;
    notes : Text;
  };

  type PackDistribution = {
    id : Nat;
    packItemId : Nat;
    date : Text;
    time : Text;
    staffId : Nat;
    quantity : Nat;
    notes : Text;
  };

  // Stable variables

  // New state variables
  stable var categories : [Category] = [];
  stable var products : [Product] = [];
  stable var staff : [Staff] = [];
  stable var usageRecords : [UsageRecord] = [];
  stable var equipmentItems : [EquipmentItem] = [];
  stable var equipmentCheckouts : [EquipmentCheckout] = [];
  stable var attendanceEntries : [AttendanceEntry] = [];
  stable var cashEntries : [CashEntry] = [];
  stable var homeServiceSettlements : [HomeServiceSettlement] = [];
  stable var packItems : [PackItem] = [];
  stable var packArrivals : [PackArrival] = [];
  stable var packDistributions : [PackDistribution] = [];

  // ID counters
  stable var nextCategoryId : Nat = 1;
  stable var nextProductId : Nat = 1;
  stable var nextStaffId : Nat = 1;
  stable var nextUsageRecordId : Nat = 1;
  stable var nextEquipmentItemId : Nat = 1;
  stable var nextEquipmentCheckoutId : Nat = 1;
  stable var nextAttendanceEntryId : Nat = 1;
  stable var nextCashEntryId : Nat = 1;
  stable var nextHomeServiceSettlementId : Nat = 1;
  stable var nextPackItemId : Nat = 1;
  stable var nextPackArrivalId : Nat = 1;
  stable var nextPackDistributionId : Nat = 1;

  // Category methods
  public query ({ caller }) func getCategories() : async [Category] {
    categories;
  };

  public shared ({ caller }) func addCategory(name : Text) : async Category {
    let category : Category = {
      id = nextCategoryId;
      name;
    };
    categories := categories.concat([category]);
    nextCategoryId += 1;
    category;
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    categories := categories.filter(func(c) { c.id != id });
  };

  // Product methods
  public query ({ caller }) func getProducts() : async [Product] {
    products;
  };

  public shared ({ caller }) func addProduct(
    name : Text,
    categoryId : Nat,
    openingStock : Nat,
    openingDate : Text,
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
      openingDate;
      currentStock = openingStock;
      unit;
      lowStockThreshold;
      rackNumber;
    };
    products := products.concat([product]);
    nextProductId += 1;
    product;
  };

  public shared ({ caller }) func updateProduct(
    id : Nat,
    name : Text,
    categoryId : Nat,
    openingStock : Nat,
    openingDate : Text,
    currentStock : Nat,
    unit : Text,
    lowStockThreshold : Nat,
    rackNumber : Text,
  ) : async () {
    products := products.map(
      func(p) {
        if (p.id == id) {
          { id; name; brand = p.brand; categoryId; openingStock; openingDate; currentStock; unit; lowStockThreshold; rackNumber };
        } else { p };
      }
    );
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    products := products.filter(func(p) { p.id != id });
  };

  public shared ({ caller }) func deleteAllProducts() : async () {
    products := [];
  };

  // Staff methods
  public query ({ caller }) func getStaff() : async [Staff] {
    staff;
  };

  public shared ({ caller }) func addStaff(name : Text, role : Text, mobile : Text) : async Staff {
    let s : Staff = {
      id = nextStaffId;
      name;
      role;
      mobile;
      pinned = false;
    };
    staff := staff.concat([s]);
    nextStaffId += 1;
    s;
  };

  public shared ({ caller }) func bulkAddStaff(names : [Text], role : Text) : async [Staff] {
    var newStaff = Array.empty<Staff>();
    for (name in names.vals()) {
      if (name != "") {
        let s : Staff = {
          id = nextStaffId;
          name;
          role;
          mobile = "";
          pinned = false;
        };
        staff := staff.concat([s]);
        newStaff := newStaff.concat([s]);
        nextStaffId += 1;
      };
    };
    newStaff;
  };

  public shared ({ caller }) func updateStaff(id : Nat, name : Text, role : Text, mobile : Text) : async () {
    staff := staff.map(
      func(s) {
        if (s.id == id) { { id; name; role; mobile; pinned = s.pinned } } else { s };
      }
    );
  };

  public shared ({ caller }) func updateStaffPin(id : Nat, pinned : Bool) : async () {
    staff := staff.map(
      func(s) {
        if (s.id == id) { { id = s.id; name = s.name; role = s.role; mobile = s.mobile; pinned } } else { s };
      }
    );
  };

  public shared ({ caller }) func deleteStaff(id : Nat) : async () {
    staff := staff.filter(func(s) { s.id != id });
  };

  public shared ({ caller }) func deleteAllStaff() : async () {
    staff := [];
  };

  // UsageRecord methods
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
  ) : async UsageRecord {
    let usageRecord : UsageRecord = {
      id = nextUsageRecordId;
      date;
      productId;
      categoryId;
      staffId;
      quantity;
      time;
      clientName;
    };
    usageRecords := usageRecords.concat([usageRecord]);
    nextUsageRecordId += 1;

    // Auto-decrement product stock
    products := products.map(
      func(p) {
        if (p.id == productId) {
          let newStock = if (p.currentStock >= quantity) { p.currentStock - quantity } else { 0 };
          { id = p.id; name = p.name; brand = p.brand; categoryId = p.categoryId; openingStock = p.openingStock; openingDate = p.openingDate; currentStock = newStock; unit = p.unit; lowStockThreshold = p.lowStockThreshold; rackNumber = p.rackNumber };
        } else { p };
      }
    );

    usageRecord;
  };

  public shared ({ caller }) func deleteUsageRecord(id : Nat) : async () {
    let maybeRecord = usageRecords.find(func(r) { r.id == id });
    switch (maybeRecord) {
      case (null) {};
      case (?record) {
        // Restore product stock
        products := products.map(
          func(p) {
            if (p.id == record.productId) {
              { id = p.id; name = p.name; brand = p.brand; categoryId = p.categoryId; openingStock = p.openingStock; openingDate = p.openingDate; currentStock = p.currentStock + record.quantity; unit = p.unit; lowStockThreshold = p.lowStockThreshold; rackNumber = p.rackNumber };
            } else { p };
          }
        );
      };
    };
    usageRecords := usageRecords.filter(func(r) { r.id != id });
  };

  // Equipment methods
  public query ({ caller }) func getEquipmentItems() : async [EquipmentItem] {
    equipmentItems;
  };

  public shared ({ caller }) func addEquipmentItem(name : Text) : async EquipmentItem {
    let item : EquipmentItem = {
      id = nextEquipmentItemId;
      name;
    };
    equipmentItems := equipmentItems.concat([item]);
    nextEquipmentItemId += 1;
    item;
  };

  public shared ({ caller }) func deleteEquipmentItem(id : Nat) : async () {
    equipmentItems := equipmentItems.filter(func(e) { e.id != id });
  };

  public query ({ caller }) func getEquipmentCheckouts() : async [EquipmentCheckout] {
    equipmentCheckouts;
  };

  public shared ({ caller }) func addEquipmentCheckout(staffId : Nat, equipmentId : Nat, date : Text, takenAt : Text) : async EquipmentCheckout {
    let checkout : EquipmentCheckout = {
      id = nextEquipmentCheckoutId;
      staffId;
      equipmentId;
      date;
      takenAt;
      returnedAt = "";
    };
    equipmentCheckouts := equipmentCheckouts.concat([checkout]);
    nextEquipmentCheckoutId += 1;
    checkout;
  };

  public shared ({ caller }) func returnEquipmentCheckout(id : Nat, returnedAt : Text) : async () {
    equipmentCheckouts := equipmentCheckouts.map(
      func(c) {
        if (c.id == id) { { id = c.id; staffId = c.staffId; equipmentId = c.equipmentId; date = c.date; takenAt = c.takenAt; returnedAt } } else { c };
      }
    );
  };

  // Attendance methods
  public query ({ caller }) func getAttendanceEntries() : async [AttendanceEntry] {
    attendanceEntries;
  };

  public shared ({ caller }) func setAttendance(date : Text, staffId : Nat, status : Text) : async AttendanceEntry {
    let entry : AttendanceEntry = {
      id = nextAttendanceEntryId;
      date;
      staffId;
      status;
    };
    attendanceEntries := attendanceEntries.concat([entry]);
    nextAttendanceEntryId += 1;
    entry;
  };

  public shared ({ caller }) func clearAttendance(date : Text, staffId : Nat) : async () {
    attendanceEntries := attendanceEntries.filter(func(e) { e.date != date or e.staffId != staffId });
  };

  public shared ({ caller }) func markAllPresent(date : Text, staffIds : [Nat]) : async () {
    for (staffId in staffIds.values()) {
      ignore await setAttendance(date, staffId, "present");
    };
  };

  // Cash ledger methods
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
  ) : async CashEntry {
    let entry : CashEntry = {
      id = nextCashEntryId;
      date;
      entryType;
      amount;
      description;
      recipientStaffId;
      notes;
    };
    cashEntries := cashEntries.concat([entry]);
    nextCashEntryId += 1;
    entry;
  };

  public shared ({ caller }) func deleteCashEntry(id : Nat) : async () {
    cashEntries := cashEntries.filter(func(e) { e.id != id });
  };

  // Home service methods
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
  ) : async HomeServiceSettlement {
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
    homeServiceSettlements := homeServiceSettlements.concat([settlement]);
    nextHomeServiceSettlementId += 1;
    settlement;
  };

  public shared ({ caller }) func deleteHomeServiceSettlement(id : Nat) : async () {
    homeServiceSettlements := homeServiceSettlements.filter(func(s) { s.id != id });
  };

  // Pack tracker methods
  public query ({ caller }) func getPackItems() : async [PackItem] {
    packItems;
  };

  public shared ({ caller }) func addPackItem(name : Text, unit : Text) : async PackItem {
    let item : PackItem = {
      id = nextPackItemId;
      name;
      unit;
    };
    packItems := packItems.concat([item]);
    nextPackItemId += 1;
    item;
  };

  public shared ({ caller }) func deletePackItem(id : Nat) : async () {
    packItems := packItems.filter(func(i) { i.id != id });
  };

  public query ({ caller }) func getPackArrivals() : async [PackArrival] {
    packArrivals;
  };

  public shared ({ caller }) func addPackArrival(packItemId : Nat, date : Text, quantity : Nat, notes : Text) : async PackArrival {
    let arrival : PackArrival = {
      id = nextPackArrivalId;
      packItemId;
      date;
      quantity;
      notes;
    };
    packArrivals := packArrivals.concat([arrival]);
    nextPackArrivalId += 1;
    arrival;
  };

  public shared ({ caller }) func deletePackArrival(id : Nat) : async () {
    packArrivals := packArrivals.filter(func(a) { a.id != id });
  };

  public query ({ caller }) func getPackDistributions() : async [PackDistribution] {
    packDistributions;
  };

  public shared ({ caller }) func addPackDistribution(
    packItemId : Nat,
    date : Text,
    time : Text,
    staffId : Nat,
    quantity : Nat,
    notes : Text,
  ) : async PackDistribution {
    let distribution : PackDistribution = {
      id = nextPackDistributionId;
      packItemId;
      date;
      time;
      staffId;
      quantity;
      notes;
    };
    packDistributions := packDistributions.concat([distribution]);
    nextPackDistributionId += 1;
    distribution;
  };

  public shared ({ caller }) func deletePackDistribution(id : Nat) : async () {
    packDistributions := packDistributions.filter(func(d) { d.id != id });
  };
};

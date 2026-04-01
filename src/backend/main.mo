import Array "mo:core/Array";
import Nat "mo:core/Nat";
import VarArray "mo:core/VarArray";
import Iter "mo:core/Iter";



actor {
  // Types

  type Category = {
    id : Nat;
    name : Text;
  };

  // Legacy Product type (without openingDate) used for migration
  type ProductV1 = {
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

  // Current Product type (with openingDate)
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

  // Legacy Staff type (without pinned) - matches previous stable var shape
  type StaffV1 = {
    id : Nat;
    name : Text;
    role : Text;
    mobile : Text;
  };

  // Current Staff type (with pinned)
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

  // Pack Tracker types
  type PackItem = {
    id : Nat;
    name : Text;
    unit : Text;
  };

  type PackStock = {
    id : Nat;
    itemId : Nat;
    date : Text;
    quantity : Nat;
    notes : Text;
  };

  type PackUsage = {
    id : Nat;
    itemId : Nat;
    date : Text;
    time : Text;
    staffId : Nat;
    quantity : Nat;
    notes : Text;
  };

  // Stable storage

  stable var categories : [Category] = [];
  // Legacy stable var - holds old products without openingDate (for migration)
  stable var products : [ProductV1] = [];
  // New stable var - holds products with openingDate
  stable var products_v2 : [Product] = [];
  // Legacy staff WITHOUT pinned field - kept for migration compatibility
  stable var staff : [StaffV1] = [];
  // Current staff WITH pinned field
  stable var staff_v2 : [Staff] = [];
  stable var usageRecords : [UsageRecord] = [];
  stable var equipmentItems : [EquipmentItem] = [];
  stable var equipmentCheckouts : [EquipmentCheckout] = [];
  stable var attendanceEntries : [AttendanceEntry] = [];
  stable var cashEntries : [CashEntry] = [];
  stable var homeServiceSettlements : [HomeServiceSettlement] = [];
  stable var packItems : [PackItem] = [];
  stable var packStocks : [PackStock] = [];
  stable var packUsages : [PackUsage] = [];

  stable var nextCategoryId : Nat = 1;
  stable var nextProductId : Nat = 1;
  stable var nextStaffId : Nat = 1;
  stable var nextUsageId : Nat = 1;
  stable var nextEquipmentItemId : Nat = 1;
  stable var nextEquipmentCheckoutId : Nat = 1;
  stable var nextAttendanceId : Nat = 1;
  stable var nextCashEntryId : Nat = 1;
  stable var nextHomeServiceSettlementId : Nat = 1;
  stable var nextPackItemId : Nat = 1;
  stable var nextPackStockId : Nat = 1;
  stable var nextPackUsageId : Nat = 1;

  // Migration: on upgrade, move old data to new versions
  system func postupgrade() {
    // Migrate products without openingDate
    if (products.size() > 0) {
      let migrated = products.map(func(p : ProductV1) : Product {
        {
          id = p.id;
          name = p.name;
          brand = p.brand;
          categoryId = p.categoryId;
          openingStock = p.openingStock;
          openingDate = "";
          currentStock = p.currentStock;
          unit = p.unit;
          lowStockThreshold = p.lowStockThreshold;
          rackNumber = p.rackNumber;
        }
      });
      products_v2 := products_v2.concat(migrated);
      products := [];
    };
    // Migrate staff without pinned field to staff_v2 with pinned=false
    if (staff.size() > 0) {
      let migratedStaff = staff.map(func(s : StaffV1) : Staff {
        {
          id = s.id;
          name = s.name;
          role = s.role;
          mobile = s.mobile;
          pinned = false;
        }
      });
      staff_v2 := staff_v2.concat(migratedStaff);
      staff := [];
    };
  };

  // Category APIs

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

  // Product APIs

  public query ({ caller }) func getProducts() : async [Product] {
    products_v2;
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
    products_v2 := products_v2.concat([product]);
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
    products_v2 := products_v2.map(
      func(p) {
        if (p.id == id) {
          { id; name; brand = p.brand; categoryId; openingStock; openingDate; currentStock; unit; lowStockThreshold; rackNumber };
        } else { p };
      }
    );
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    products_v2 := products_v2.filter(func(p) { p.id != id });
  };

  // Staff APIs

  public query ({ caller }) func getStaff() : async [Staff] {
    staff_v2;
  };

  public shared ({ caller }) func addStaff(name : Text, role : Text, mobile : Text) : async Staff {
    let newStaff : Staff = {
      id = nextStaffId;
      name;
      role;
      mobile;
      pinned = false;
    };
    staff_v2 := staff_v2.concat([newStaff]);
    nextStaffId += 1;
    newStaff;
  };

  public shared ({ caller }) func updateStaff(id : Nat, name : Text, role : Text, mobile : Text) : async () {
    staff_v2 := staff_v2.map(
      func(s) {
        if (s.id == id) { { id; name; role; mobile; pinned = s.pinned } } else { s };
      }
    );
  };

  public shared ({ caller }) func updateStaffPin(id : Nat, pinned : Bool) : async () {
    staff_v2 := staff_v2.map(
      func(s) {
        if (s.id == id) { { id = s.id; name = s.name; role = s.role; mobile = s.mobile; pinned } } else { s };
      }
    );
  };

  public shared ({ caller }) func bulkAddStaff(names : [Text], role : Text) : async [Staff] {
    var added : [Staff] = [];
    for (name in names.vals()) {
      if (name != "") {
        let newStaff : Staff = {
          id = nextStaffId;
          name;
          role;
          mobile = "";
          pinned = false;
        };
        staff_v2 := staff_v2.concat([newStaff]);
        added := added.concat([newStaff]);
        nextStaffId += 1;
      };
    };
    added;
  };

  public shared ({ caller }) func deleteStaff(id : Nat) : async () {
    staff_v2 := staff_v2.filter(func(s) { s.id != id });
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
    usageRecords := usageRecords.concat([usageRecord]);
    nextUsageId += 1;

    // Decrease product stock automatically
    products_v2 := products_v2.map(
      func(p) {
        if (p.id == productId) {
          let newStock = if (p.currentStock >= quantity) { p.currentStock - quantity } else { 0 };
          { id = p.id; name = p.name; brand = p.brand; categoryId = p.categoryId; openingStock = p.openingStock; openingDate = p.openingDate; currentStock = newStock; unit = p.unit; lowStockThreshold = p.lowStockThreshold; rackNumber = p.rackNumber };
        } else { p };
      }
    );
  };

  public shared ({ caller }) func deleteUsageRecord(id : Nat) : async () {
    var deletedProductId : Nat = 0;
    var deletedQuantity : Nat = 0;
    for (u in usageRecords.vals()) {
      if (u.id == id) {
        deletedProductId := u.productId;
        deletedQuantity := u.quantity;
      };
    };
    if (deletedProductId != 0 or deletedQuantity != 0) {
      products_v2 := products_v2.map(
        func(p) {
          if (p.id == deletedProductId) {
            { id = p.id; name = p.name; brand = p.brand; categoryId = p.categoryId; openingStock = p.openingStock; openingDate = p.openingDate; currentStock = p.currentStock + deletedQuantity; unit = p.unit; lowStockThreshold = p.lowStockThreshold; rackNumber = p.rackNumber };
          } else { p };
        }
      );
    };
    usageRecords := usageRecords.filter(func(u) { u.id != id });
  };

  // Equipment APIs

  public query ({ caller }) func getEquipmentItems() : async [EquipmentItem] {
    equipmentItems;
  };

  public shared ({ caller }) func addEquipmentItem(name : Text) : async EquipmentItem {
    let equipmentItem : EquipmentItem = { id = nextEquipmentItemId; name };
    equipmentItems := equipmentItems.concat([equipmentItem]);
    nextEquipmentItemId += 1;
    equipmentItem;
  };

  public shared ({ caller }) func deleteEquipmentItem(id : Nat) : async () {
    equipmentItems := equipmentItems.filter(func(e) { e.id != id });
  };

  public query ({ caller }) func getEquipmentCheckouts() : async [EquipmentCheckout] {
    equipmentCheckouts;
  };

  public shared ({ caller }) func addEquipmentCheckout(staffId : Nat, equipmentId : Nat, date : Text, takenAt : Text) : async () {
    let checkout : EquipmentCheckout = { id = nextEquipmentCheckoutId; staffId; equipmentId; date; takenAt; returnedAt = "" };
    equipmentCheckouts := equipmentCheckouts.concat([checkout]);
    nextEquipmentCheckoutId += 1;
  };

  public shared ({ caller }) func returnEquipmentCheckout(id : Nat, returnedAt : Text) : async () {
    equipmentCheckouts := equipmentCheckouts.map(
      func(e) {
        if (e.id == id) { { id = e.id; staffId = e.staffId; equipmentId = e.equipmentId; date = e.date; takenAt = e.takenAt; returnedAt } } else { e };
      }
    );
  };

  // Attendance APIs

  public query ({ caller }) func getAttendanceEntries() : async [AttendanceEntry] {
    attendanceEntries;
  };

  public shared ({ caller }) func setAttendance(date : Text, staffId : Nat, status : Text) : async () {
    let attendance : AttendanceEntry = { id = nextAttendanceId; date; staffId; status };
    attendanceEntries := attendanceEntries.concat([attendance]);
    nextAttendanceId += 1;
  };

  public shared ({ caller }) func clearAttendance(date : Text, staffId : Nat) : async () {
    attendanceEntries := attendanceEntries.filter(func(a) { a.date != date or a.staffId != staffId });
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
    let cashEntry : CashEntry = { id = nextCashEntryId; date; entryType; amount; description; recipientStaffId; notes };
    cashEntries := cashEntries.concat([cashEntry]);
    nextCashEntryId += 1;
  };

  public shared ({ caller }) func deleteCashEntry(id : Nat) : async () {
    cashEntries := cashEntries.filter(func(c) { c.id != id });
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
    let settlement : HomeServiceSettlement = { id = nextHomeServiceSettlementId; date; staffId; clientName; serviceAmount; clientPaid; travelExpense; notes };
    homeServiceSettlements := homeServiceSettlements.concat([settlement]);
    nextHomeServiceSettlementId += 1;
  };

  public shared ({ caller }) func deleteHomeServiceSettlement(id : Nat) : async () {
    homeServiceSettlements := homeServiceSettlements.filter(func(h) { h.id != id });
  };

  // Pack Tracker APIs

  public query ({ caller }) func getPackItems() : async [PackItem] {
    packItems;
  };

  public shared ({ caller }) func addPackItem(name : Text, unit : Text) : async PackItem {
    let item : PackItem = { id = nextPackItemId; name; unit };
    packItems := packItems.concat([item]);
    nextPackItemId += 1;
    item;
  };

  public shared ({ caller }) func deletePackItem(id : Nat) : async () {
    packItems := packItems.filter(func(p) { p.id != id });
  };

  public query ({ caller }) func getPackStocks() : async [PackStock] {
    packStocks;
  };

  public shared ({ caller }) func addPackStock(itemId : Nat, date : Text, quantity : Nat, notes : Text) : async () {
    let s : PackStock = { id = nextPackStockId; itemId; date; quantity; notes };
    packStocks := packStocks.concat([s]);
    nextPackStockId += 1;
  };

  public query ({ caller }) func getPackUsages() : async [PackUsage] {
    packUsages;
  };

  public shared ({ caller }) func addPackUsage(itemId : Nat, date : Text, time : Text, staffId : Nat, quantity : Nat, notes : Text) : async () {
    let u : PackUsage = { id = nextPackUsageId; itemId; date; time; staffId; quantity; notes };
    packUsages := packUsages.concat([u]);
    nextPackUsageId += 1;
  };

  public shared ({ caller }) func deletePackUsage(id : Nat) : async () {
    packUsages := packUsages.filter(func(u) { u.id != id });
  };
};

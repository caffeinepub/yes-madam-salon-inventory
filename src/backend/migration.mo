import Array "mo:core/Array";
import VarArray "mo:core/VarArray";
import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
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

  type LegacyActor = {
    nextCategoryId : Nat;
    nextProductId : Nat;
    nextStaffId : Nat;
    nextUsageId : Nat;
    categories : Map.Map<Nat, Category>;
    products : Map.Map<Nat, Product>;
    staffMembers : Map.Map<Nat, Staff>;
    usageRecords : Map.Map<Nat, UsageRecord>;
    allCategoriesPresent : Bool;
    initialCategories : [(Nat, Text)];
  };

  public func run(old : LegacyActor) : {} {
    {
      categories = old.categories.toArray();
      products = old.products.toArray();
      staff = old.staffMembers.toArray();
      usageRecords = old.usageRecords.toArray();
      nextCategoryId = old.nextCategoryId;
      nextProductId = old.nextProductId;
      nextStaffId = old.nextStaffId;
      nextUsageId = old.nextUsageId;
      equipmentItems = [];
      equipmentCheckouts = [];
      attendanceEntries = [];
      cashEntries = [];
      homeServiceSettlements = [];
      nextEquipmentItemId = 1;
      nextEquipmentCheckoutId = 1;
      nextAttendanceId = 1;
      nextCashEntryId = 1;
      nextHomeServiceSettlementId = 1;
    };
  };
};

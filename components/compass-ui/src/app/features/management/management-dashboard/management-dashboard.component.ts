import { Component, OnInit } from "@angular/core";
import { SolutionService } from "../../../core/services/solution.service";
import { CategoryService } from "../../../core/services/category.service";
import { GroupService } from "../../../core/services/group.service";

interface DashboardStats {
  solutions: number;
  totalSolutions: number;
  totalCategories: number;
  totalGroups: number;
}

@Component({
  selector: "tc-management-dashboard",
  templateUrl: "./management-dashboard.component.html",
  styleUrls: ["./management-dashboard.component.scss"],
})
export class ManagementDashboardComponent implements OnInit {
  stats: DashboardStats = {
    solutions: 0,
    totalSolutions: 0,
    totalCategories: 0,
    totalGroups: 0,
  };

  constructor(
    private solutionService: SolutionService,
    private categoryService: CategoryService,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  private loadStats() {
    // Load my items count
    this.solutionService.getMySolutions(0, 1).subscribe({
      next: (response) => {
        this.stats.solutions = response.total || 0;
      },
      error: (error) => {
        console.error("Error loading item count:", error);
      },
    });

    // Load total solutions count
    this.solutionService.getAllSolutions(0, 1).subscribe({
      next: (response) => {
        this.stats.totalSolutions = response.total || 0;
      },
      error: (error) => {
        console.error("Error loading total solutions count:", error);
      },
    });

    // Load total categories count
    this.categoryService.getAllCategories(0, 1).subscribe({
      next: (response) => {
        this.stats.totalCategories = response.total || 0;
      },
      error: (error) => {
        console.error("Error loading total categories count:", error);
      },
    });

    // Load total groups count
    this.groupService.getAllGroups(0, 1).subscribe({
      next: (response) => {
        this.stats.totalGroups = response.total || 0;
      },
      error: (error) => {
        console.error("Error loading total groups count:", error);
      },
    });
  }
}

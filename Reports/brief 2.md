## **Updated Project Brief: UI/UX Refinement & Feature Implementation**

---

### **1. Visual & Layout Adjustments**
* **Controls Card:** Reduce vertical dimensions by tightening internal padding.
* **Transport Controls:** Relocate from the left-hand side to the center of the interface.
* **Top-Right Navigation:** * **Import Button:** Relocate to the left of the new utility button group.
    * **New Utility Group:** Implement three specific icons in the right corner:
        1.  **MIDI Panic:** Represented by an exclamation point (**!**).
        2.  **Information:** Represented by an "**i**" icon; triggers a modal pop-up with application details.
        3.  **Settings:** Represented by a **cog** icon; triggers a modal window (placeholder content).

### **2. Workspace & Waveform Visualization**
* **Overview Module:** Initialize the view to display the **entire waveform** of the complete file by default.
* **Waveform Aesthetics:** Increase contrast by changing the waveform color from gray to black (or a very dark shade).
* **Hit Point Standardization:** * Eliminate "Cyan Blue" variations. 
    * All hit points (locked or sensitivity-generated) must use the standard "Normal Blue."
* **Loop Indicators:** Consolidate redundant UI. Remove indicators from the ruler; retain them exclusively within the waveform area.

---

### **3. Navigation & Interaction Logic**

| Feature | Interaction Logic |
| :--- | :--- |
| **Playback Control** | Enable **Space Bar** to toggle playback from the current playhead position. |
| **Playhead Positioning** | Reposition the playback head by clicking any point along the **Ruler**. |
| **Locator Snapping** | **L/R Locators** snap to the nearest Hit Points during drag operations. |
| **Snap Override** | Hold **Shift** key while dragging to bypass snapping for fluid placement. |
| **Marquee Selection** | Implement batch selection functionality for hit points within the workspace. |

---

### **4. Locator Enhancements (L/R)**
* **Geometry:** Increase size of triangle heads. Implement "Flagpole" lines extending from the head to the bottom of the workspace.
* **Styling:** * **Color:** Solid Black.
    * **Labeling:** Explicit **"L"** and **"R"** text labels for clear identification.
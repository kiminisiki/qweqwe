document.addEventListener('DOMContentLoaded', function() {
    // Initialize date in header
    const dateHeader = document.getElementById('current-date');
    const currentDate = new Date();
    const options = { month: 'long', day: '2-digit', year: 'numeric' };
    
    const urlParams = new URLSearchParams(window.location.search);
    const selectedDate = urlParams.get('date') || sessionStorage.getItem('selectedDate');

    if (selectedDate) {
        const parsedDate = new Date(selectedDate);
        dateHeader.textContent = parsedDate.toLocaleDateString('en-US', options);
        sessionStorage.setItem('selectedDate', selectedDate);
    } else {
        dateHeader.textContent = currentDate.toLocaleDateString('en-US', options);
    }

    // Initialize cashier grid
    const cashierGrid = document.getElementById('cashierGrid');
    const totalCells = 15;

    // Modified table cell creation to restore state from localStorage
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cashier-cell cashier-available';
        cell.innerHTML = `Table ${i + 1}`;
        cell.dataset.tableNumber = i + 1;

        cell.addEventListener('click', function() {
            document.querySelectorAll('.cashier-cell').forEach(cell => cell.classList.remove('cashier-selected'));
            if (cell.classList.contains('cashier-available')) {
                cell.classList.add('cashier-selected');
            }
        });

        cashierGrid.appendChild(cell);
    }

    const formContainer = document.querySelector('.form-section');
    const addReservationBtn = document.querySelector('.action-btn:nth-child(1)');
    const editReservationBtn = document.querySelector('.action-btn:nth-child(2)');
    const checkoutReservationBtn = document.querySelector('.action-btn:nth-child(3)');
    const checkoutHistoryBtn = document.querySelector('.action-btn:nth-child(4)');
    const addBtn = document.querySelector('.add-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const tableBody = document.getElementById('reservationTableBody');
    let selectedRowForEdit = null;

    formContainer.style.display = 'none';

    // Function to clear specific reservation
    function clearSelectedReservation(selectedRow) {
        if (selectedRow) {
            const tableNumber = selectedRow.dataset.tableNumber;

            // Remove the row from the table
            selectedRow.remove();

            // Update localStorage
            const currentReservations = JSON.parse(localStorage.getItem('currentReservations')) || [];
            const updatedReservations = currentReservations.filter(reservation =>
                reservation.tableNumber !== tableNumber
            );
            localStorage.setItem('currentReservations', JSON.stringify(updatedReservations));

            // Update the table's availability
            const cell = document.querySelector(`.cashier-cell[data-tablenumber='${tableNumber}']`);
            if (cell) {
                cell.classList.remove('cashier-unavailable');
                cell.classList.add('cashier-available');
            }
            saveTableStates();
        }
    }

    function saveReservations() {
        const reservations = [];
        document.querySelectorAll('#reservationTableBody tr').forEach(row => {
            reservations.push({
                name: row.cells[0].textContent,
                time: row.cells[1].textContent,
                pax: row.cells[2].textContent,
                contact: row.cells[3].textContent,
                tableNumber: row.dataset.tableNumber || 'Not Assigned'
            });
        });
        localStorage.setItem('currentReservations', JSON.stringify(reservations));
    }

    function saveTableStates() {
        const tableStates = [];
        document.querySelectorAll('.cashier-cell').forEach(cell => {
            tableStates.push({
                number: cell.dataset.tableNumber,
                isAvailable: cell.classList.contains('cashier-available')
            });
        });
        localStorage.setItem('tableStates', JSON.stringify(tableStates));
    }

    function loadReservations() {
        const savedReservations = localStorage.getItem('currentReservations');
        if (savedReservations) {
            const reservations = JSON.parse(savedReservations);
            tableBody.innerHTML = '';
            reservations.forEach(reservation => {
                const newRow = document.createElement('tr');
                newRow.dataset.tableNumber = reservation.tableNumber;
                newRow.innerHTML = `
                    <td>${reservation.name}</td>
                    <td>${reservation.time}</td>
                    <td>${reservation.pax}</td>
                    <td>${reservation.contact}</td>
                    <td>${reservation.tableNumber}</td>
                `;
                newRow.addEventListener('click', () => selectRow(newRow));
                tableBody.appendChild(newRow);
                
                // Mark the corresponding table as unavailable
                const cell = document.querySelector(`.cashier-cell[data-tablenumber='${reservation.tableNumber}']`);
                if (cell) {
                    cell.classList.remove('cashier-available');
                    cell.classList.add('cashier-unavailable');
                }
            });
        }
    }

    function loadTableStates() {
        const savedTableStates = localStorage.getItem('tableStates');
        if (savedTableStates) {
            const tableStates = JSON.parse(savedTableStates);
            tableStates.forEach(state => {
                const cell = document.querySelector(`.cashier-cell[data-tablenumber='${state.number}']`);
                if (cell) {
                    cell.classList.remove('cashier-available', 'cashier-unavailable');
                    cell.classList.add(state.isAvailable ? 'cashier-available' : 'cashier-unavailable');
                }
            });
        }
    }

    function selectRow(row) {
        document.querySelectorAll('#reservationTableBody tr').forEach(row => row.classList.remove('selected'));
        row.classList.add('selected');
    }

    // Load reservations and table states when page loads
    loadReservations();
    loadTableStates();

    addReservationBtn.addEventListener('click', function() {
        formContainer.style.display = 'flex';
        document.querySelectorAll('input').forEach(input => input.value = '');
        addBtn.textContent = 'ADD';
        selectedRowForEdit = null;
    });

    // ADD/Update button click handler
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();

        // Get form values
        const name = document.querySelector('input[placeholder="Enter name"]').value;
        const time = document.querySelector('input[placeholder="Enter time"]').value;
        const pax = document.querySelector('input[placeholder="Enter number of guests"]').value;
        const contact = document.querySelector('input[placeholder="Enter contact number"]').value;

        // Get the selected table
        const selectedTable = document.querySelector('.cashier-cell.cashier-selected');
        if (!selectedTable) {
            alert('Please select a table first!');
            return;
        }

        // Validate inputs
        if (!name || !time || !pax || !contact) {
            alert('Please fill in all fields.');
            return;
        }

        if (selectedRowForEdit) {
            // Update existing row
            const previousTable = document.querySelector(`.cashier-cell[data-tablenumber='${selectedRowForEdit.dataset.tableNumber}']`);
            if (previousTable) {
                previousTable.classList.remove('cashier-unavailable');
                previousTable.classList.add('cashier-available');
            }

            selectedRowForEdit.innerHTML = `
                <td>${name}</td>
                <td>${time}</td>
                <td>${pax}</td>
                <td>${contact}</td>
                <td>${selectedTable.dataset.tableNumber}</td>
            `;
            selectedRowForEdit.dataset.tableNumber = selectedTable.dataset.tableNumber;
            selectedRowForEdit.classList.remove('selected');
            selectedRowForEdit = null;
            addBtn.textContent = 'ADD';
        } else {
            // Add new row
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${name}</td>
                <td>${time}</td>
                <td>${pax}</td>
                <td>${contact}</td>
                <td>${selectedTable.dataset.tableNumber}</td>
            `;
            newRow.dataset.tableNumber = selectedTable.dataset.tableNumber;
            newRow.addEventListener('click', () => selectRow(newRow));
            tableBody.appendChild(newRow);
        }

        // Mark the selected table as unavailable
        selectedTable.classList.remove('cashier-available', 'cashier-selected');
        selectedTable.classList.add('cashier-unavailable');

        saveReservations();
        saveTableStates();

        document.querySelectorAll('input').forEach(input => input.value = '');
        formContainer.style.display = 'none';
    });

    cancelBtn.addEventListener('click', function() {
        document.querySelectorAll('input').forEach(input => input.value = '');
        formContainer.style.display = 'none';
        addBtn.textContent = 'ADD';
        selectedRowForEdit = null;
    });

    editReservationBtn.addEventListener('click', function() {
        const selectedRow = document.querySelector('tr.selected');
        if (!selectedRow) {
            alert('Please select a reservation to edit');
            return;
        }

        formContainer.style.display = 'flex';
        selectedRowForEdit = selectedRow;

        const cells = selectedRow.cells;
        document.querySelector('input[placeholder="Enter time"]').value = cells[1].textContent;
        document.querySelector('input[placeholder="Enter name"]').value = cells[0].textContent;
        document.querySelector('input[placeholder="Enter number of guests"]').value = cells[2].textContent;
        document.querySelector('input[placeholder="Enter contact number"]').value = cells[3].textContent;

        addBtn.textContent = 'Update';
    });

    checkoutReservationBtn.addEventListener('click', function() {
        const selectedRow = document.querySelector('tr.selected');
        if (!selectedRow) {
            alert('Please select a reservation to check out');
            return;
        }

        // Get all reservation details
        const name = selectedRow.cells[0].textContent;
        const timeIn = selectedRow.cells[1].textContent;
        const pax = selectedRow.cells[2].textContent;
        const contact = selectedRow.cells[3].textContent;
        const tableNumber = selectedRow.dataset.tableNumber;

        const checkoutTime = prompt('Enter checkout time (HH:MM):', 
            new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );
        
        if (checkoutTime) {
            const checkoutData = {
                name: name,
                timeIn: timeIn,
                timeOut: checkoutTime,
                pax: pax,
                contact: contact,
                tableNumber: tableNumber,
                date: sessionStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0]
            };
            
            // Save checkout history
            const checkoutHistory = JSON.parse(localStorage.getItem('checkoutHistory')) || [];
            checkoutHistory.push(checkoutData);
            localStorage.setItem('checkoutHistory', JSON.stringify(checkoutHistory));
            
            // Remove the reservation
            clearSelectedReservation(selectedRow);
        }
    });

    // Checkout History button click handler
    checkoutHistoryBtn.addEventListener('click', function() {
        // Get the current selected date from sessionStorage
        const selectedDate = sessionStorage.getItem('selectedDate');
        
        // Redirect to checkout.html with the selected date if available
        if (selectedDate) {
            window.location.href = `checkout.html?date=${selectedDate}`;
        } else {
            window.location.href = 'checkout.html';
        }
    });
});

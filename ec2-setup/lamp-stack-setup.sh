# Update system
sudo yum update -y

# Install Apache
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd

# Install PHP
sudo yum install -y php php-mysqlnd
sudo systemctl restart httpd

# Create a simple PHP page
sudo tee /var/www/html/index.php > /dev/null <<EOF
<?php
echo "<h1>Expense Tracker Web Server</h1>";
echo "<p>Server: " . gethostname() . "</p>";
echo "<p>Time: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Simple expense tracker interface
echo "<h2>Add Expense (Demo)</h2>";
echo "<form>";
echo "Amount: <input type='number' step='0.01'><br><br>";
echo "Category: <select><option>Food</option><option>Transport</option></select><br><br>";
echo "Description: <input type='text'><br><br>";
echo "<button type='button' onclick='alert(\"This would connect to your API Gateway!\")'>Add Expense</button>";
echo "</form>";
?>
EOF

# Set permissions
sudo chown -R apache:apache /var/www/html/
sudo chmod -R 755 /var/www/html/

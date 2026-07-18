`timescale 1ns/1ps

module tb_mul8u;

reg  [7:0] a;
reg  [7:0] b;
wire [15:0] y;

mul8u uut (
    .a(a),
    .b(b),
    .y(y)
);

initial begin
    a = 0;   b = 0;
    #10;

    a = 8'd5;   b = 8'd3;     // 15
    #10;

    a = 8'd10;  b = 8'd10;    // 100
    #10;

    a = 8'd20;  b = 8'd15;    // 300
    #10;

    a = 8'd255; b = 8'd255;   // 65025
    #10;

    $finish;
end

endmodule